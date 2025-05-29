const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');

// Command line arguments
const inputFile = process.argv[2];        // Đường dẫn video đầu vào
const outputDir = process.argv[3];        // Thư mục đầu ra
const movieId = process.argv[4];          // ID phim
const episodeId = process.argv[5];        // ID tập
const r2AccountId = process.argv[6];      // R2 Account ID
const r2AccessKey = process.argv[7];      // R2 Access Key
const r2Secret = process.argv[8];         // R2 Secret Key
const r2Bucket = process.argv[9];         // R2 Bucket Name
const callbackUrl = process.argv[10];     // Callback URL

console.log(`[HLS Processor] Khởi động với parameters:`);
console.log(`- Input File: ${inputFile}`);
console.log(`- Output Dir: ${outputDir}`);
console.log(`- Movie ID: ${movieId}`);
console.log(`- Episode ID: ${episodeId}`);
console.log(`- R2 Account: ${r2AccountId}`);
console.log(`- R2 Bucket: ${r2Bucket}`);
console.log(`- Callback URL: ${callbackUrl}`);

// Kiểm tra file đầu vào tồn tại
try {
  const stats = fs.statSync(inputFile);
  console.log(`[HLS Processor] File đầu vào tồn tại, kích thước: ${stats.size} bytes`);
  
  // Kiểm tra quyền truy cập
  fs.accessSync(inputFile, fs.constants.R_OK);
  console.log(`[HLS Processor] Có quyền đọc file đầu vào`);
} catch (error) {
  console.error(`[HLS Processor] Lỗi kiểm tra file đầu vào: ${error.message}`);
  if (callbackUrl) {
    sendCallback('error', `File không tồn tại hoặc không có quyền truy cập: ${error.message}`)
      .finally(() => process.exit(1));
  } else {
    process.exit(1);
  }
}

// Thêm cấu hình giới hạn tài nguyên và timeout
const CONFIG = {
  MAX_CONCURRENT_UPLOADS: 3,
  UPLOAD_TIMEOUT: 30000, // 30 seconds
  FFMPEG_TIMEOUT: 3600000, // 1 hour
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000 // 2 seconds
};

// Pool kết nối R2 để tái sử dụng
const s3Pool = {
  connections: [],
  getConnection() {
    if (this.connections.length === 0) {
      return new AWS.S3({
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        accessKeyId: r2AccessKey,
        secretAccessKey: r2Secret,
        signatureVersion: 'v4',
        region: 'auto',
        maxRetries: 3,
        retryDelayOptions: {
          base: 1000
        }
      });
    }
    return this.connections.pop();
  },
  
  releaseConnection(conn) {
    if (this.connections.length < 5) { // Max 5 connections in pool
      this.connections.push(conn);
    }
  }
};

// Cấu hình R2 với connection pooling
const s3 = s3Pool.getConnection();

// Các độ phân giải và bitrate cho HLS
const RESOLUTIONS = [
  { height: 240, bitrate: '400k' },
  { height: 360, bitrate: '700k' },
  { height: 480, bitrate: '1500k' },
  { height: 720, bitrate: '2500k' },
  { height: 1080, bitrate: '4500k' }
];

// Độ phân giải giảm thiểu cho video dài (trên 20 phút)
const REDUCED_RESOLUTIONS = [
  { height: 360, bitrate: '700k' },
  { height: 720, bitrate: '2500k' }
];

// Thời lượng segment (giây)
const HLS_SEGMENT_DURATION = '6';

// Thêm biến để theo dõi lỗi ffmpeg
let ffmpegErrorOutput = '';

// Hàm tạo thư mục riêng cho mỗi quá trình xử lý
function createProcessDirectory(baseDir, movieId, episodeId) {
  const processDir = path.join(baseDir, `process_${movieId}_${episodeId}_${Date.now()}`);
  fs.mkdirSync(processDir, { recursive: true });
  console.log(`[HLS Processor] Đã tạo thư mục xử lý: ${processDir}`);
  return processDir;
}

// Hàm tạo thumbnail từ video
async function createThumbnail(videoPath, processDir, timeInSeconds = 10) {
  return new Promise((resolve, reject) => {
    console.log(`[HLS Processor] Đang tạo thumbnail tại giây thứ ${timeInSeconds}`);
    
    const thumbnailDir = path.join(processDir, 'thumbnail');
    const thumbnailPath = path.join(thumbnailDir, 'thumbnail.jpg');
    
    // Tạo thư mục thumbnail
    fs.mkdirSync(thumbnailDir, { recursive: true });
    console.log(`[HLS Processor] Đã tạo thư mục thumbnail: ${thumbnailDir}`);
    
    const ffmpeg = spawn('ffmpeg', [
      '-y',  // Tự động ghi đè file nếu tồn tại
      '-i', videoPath,
      '-ss', timeInSeconds.toString(),
      '-vframes', '1',
      '-vf', 'scale=480:-1',
      '-q:v', '2',
      thumbnailPath
    ]);
    
    let ffmpegError = '';
    
    ffmpeg.stderr.on('data', (data) => {
      ffmpegError += data.toString();
      console.log(`[ffmpeg thumbnail] ${data.toString()}`);
    });
    
    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        try {
          // Kiểm tra file thumbnail đã được tạo
          if (!fs.existsSync(thumbnailPath)) {
            reject(new Error('Thumbnail file was not created'));
            return;
          }

          // Kiểm tra kích thước file
          const stats = fs.statSync(thumbnailPath);
          if (stats.size === 0) {
            reject(new Error('Thumbnail file is empty'));
            return;
          }

          console.log(`[HLS Processor] Thumbnail created successfully: ${thumbnailPath} (${stats.size} bytes)`);

          // Upload thumbnail lên R2
          const r2ThumbnailPath = `episodes/${movieId}/${episodeId}/thumbnail.jpg`;
          await uploadFileToR2(thumbnailPath, r2ThumbnailPath);
          console.log(`[HLS Processor] Đã tạo và upload thumbnail thành công`);
          resolve(r2ThumbnailPath);
        } catch (error) {
          reject(new Error(`Lỗi khi xử lý thumbnail: ${error.message}`));
        }
      } else {
        reject(new Error(`ffmpeg exited with code ${code} when creating thumbnail. Error: ${ffmpegError}`));
      }
    });
  });
}

// Hàm cập nhật job metadata
async function updateJobMetadata(metadata) {
  if (!callbackUrl) return;
  
  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Backend-Secret': 'alldrama-backend-secret'
      },
      body: JSON.stringify({
        status: 'metadata_update',
        metadata: metadata,
        movieId,
        episodeId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(`[HLS Processor] Đã cập nhật metadata thành công`);
  } catch (error) {
    console.error(`[HLS Processor] Lỗi khi cập nhật metadata: ${error.message}`);
  }
}

// Hàm đọc đệ quy tất cả file trong thư mục
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Hàm xóa thư mục đệ quy
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`[HLS Processor] Xóa thư mục cũ: ${dirPath}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Cải thiện hàm copy file với timeout và retry
function copyFile(source, target) {
  return new Promise((resolve, reject) => {
    console.log(`[HLS Processor] Copying ${source} to ${target}`);
    
    // Kiểm tra file source trước khi copy
    if (!fs.existsSync(source)) {
      return reject(new Error(`Source file không tồn tại: ${source}`));
    }
    
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(target);
    
    // Timeout cho copy operation
    const timeout = setTimeout(() => {
      readStream.destroy();
      writeStream.destroy();
      reject(new Error('Copy operation timeout'));
    }, CONFIG.UPLOAD_TIMEOUT);
    
    readStream.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Error reading source file: ${error.message}`));
    });
    
    writeStream.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Error writing target file: ${error.message}`));
    });
    
    writeStream.on('finish', () => {
      clearTimeout(timeout);
      
      // Kiểm tra kích thước file sau khi copy
      const sourceStats = fs.statSync(source);
      const targetStats = fs.statSync(target);
      
      if (sourceStats.size !== targetStats.size) {
        reject(new Error(`File size mismatch: source ${sourceStats.size}, target ${targetStats.size}`));
        return;
      }
      
      console.log(`[HLS Processor] File copied successfully (${targetStats.size} bytes)`);
      resolve();
    });
    
    readStream.pipe(writeStream);
  });
}

// Cập nhật hàm processHLS
async function processHLS() {
  try {
    console.log(`[HLS Processor] Bắt đầu xử lý: ${inputFile}`);
    
    // Tạo thư mục riêng cho quá trình này
    const processDir = createProcessDirectory(outputDir, movieId, episodeId);
    
    // Copy file original.mp4 vào thư mục process
    const processInputFile = path.join(processDir, 'original.mp4');
    await copyFile(inputFile, processInputFile);
    console.log(`[HLS Processor] Đã copy file input vào thư mục process`);
    
    // Lấy thông tin video để quyết định độ phân giải và cập nhật metadata
    console.log(`[HLS Processor] Đang lấy thông tin video...`);
    const duration = await getVideoDuration(processInputFile);
    console.log(`[HLS Processor] Video có thời lượng: ${duration} giây`);
    
    // Cập nhật metadata
    await updateJobMetadata({
      duration: duration,
      status: 'processing',
      progress: 0
    });
    
    // Tạo thumbnail
    await createThumbnail(processInputFile, processDir);
    
    // Nếu video dài hơn 20 phút, sử dụng ít độ phân giải hơn
    const resolutionsToUse = duration > 1200 ? REDUCED_RESOLUTIONS : RESOLUTIONS;
    console.log(`[HLS Processor] Sử dụng ${resolutionsToUse.length} độ phân giải`);
    
    // Khởi tạo master playlist
    let masterPlaylistContent = '#EXTM3U\n';
    masterPlaylistContent += '#EXT-X-VERSION:7\n';
    masterPlaylistContent += '#EXT-X-INDEPENDENT-SEGMENTS\n';
    
    // Biến theo dõi số độ phân giải đã hoàn thành
    let completedResolutions = 0;
    
    // Xử lý từng độ phân giải và thu thập thông tin cho master playlist
    const streamInfos = [];
    for (const resolution of resolutionsToUse) {
      const streamInfo = await processResolution(resolution, duration, completedResolutions, resolutionsToUse, processDir);
      streamInfos.push(streamInfo);
      completedResolutions++;
    }
    
    // Thêm thông tin stream vào master playlist theo thứ tự bitrate tăng dần
    streamInfos
      .sort((a, b) => parseInt(a.bandwidth) - parseInt(b.bandwidth))
      .forEach(({ bandwidth, width, height, filename }) => {
        masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`;
        masterPlaylistContent += `${filename}\n`;
      });
    
    // Ghi master playlist sau khi đã có đầy đủ thông tin
    const masterPlaylistPath = path.join(processDir, 'master.m3u8');
    fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);
    console.log(`[HLS Processor] Đã tạo master playlist với ${streamInfos.length} streams`);
    
    // Kiểm tra nội dung master playlist
    const masterContent = fs.readFileSync(masterPlaylistPath, 'utf8');
    console.log(`[HLS Processor] Nội dung master playlist:\n${masterContent}`);
    
    // Upload toàn bộ thư mục HLS lên R2
    console.log(`[HLS Processor] Bắt đầu upload thư mục HLS lên R2`);
    const r2HlsPath = `episodes/${movieId}/${episodeId}/hls`;
    
    try {
      // Lấy tất cả file trong thư mục process
      const allFiles = getAllFiles(processDir);
      console.log(`[HLS Processor] Tìm thấy ${allFiles.length} file cần upload`);
      
      // Chuẩn bị danh sách upload tasks, loại trừ master.m3u8 và original.mp4
      const uploadTasks = [];
      for (const filePath of allFiles) {
        if (filePath !== masterPlaylistPath && filePath !== processInputFile) {
          const relativePath = path.relative(processDir, filePath);
          const r2Key = path.join(r2HlsPath, relativePath).replace(/\\/g, '/');
          uploadTasks.push({
            filePath,
            r2Key,
            uploadPromise: uploadFileToR2(filePath, r2Key)
          });
        }
      }
      
      // Upload files với giới hạn concurrent
      if (uploadTasks.length > 0) {
        console.log(`[HLS Processor] Uploading ${uploadTasks.length} files in batches`);
        await uploadFilesWithLimit(uploadTasks);
      }
      
      // Upload master.m3u8 cuối cùng
      await uploadFileToR2(masterPlaylistPath, `${r2HlsPath}/master.m3u8`);
      
      console.log(`[HLS Processor] Upload hoàn tất`);

      // Cập nhật metadata khi hoàn thành
      await updateJobMetadata({
        status: 'completed',
        progress: 100,
        hlsPath: r2HlsPath,
        duration: duration,
        resolutions: resolutionsToUse.map(r => `${r.height}p`)
      });

      // Xóa thư mục process sau khi hoàn thành
      fs.rmSync(processDir, { recursive: true, force: true });
      console.log(`[HLS Processor] Đã xóa thư mục process: ${processDir}`);

      // Xóa file original.mp4 gốc một cách an toàn
      try {
        // Kiểm tra xem có process nào khác đang sử dụng file này không
        const lockFile = `${inputFile}.lock`;
        if (!fs.existsSync(lockFile)) {
          fs.unlinkSync(inputFile);
          console.log(`[HLS Processor] Đã xóa file original.mp4 gốc: ${inputFile}`);
        } else {
          console.log(`[HLS Processor] File original.mp4 đang được sử dụng bởi process khác, bỏ qua việc xóa`);
        }
      } catch (unlinkError) {
        console.warn(`[HLS Processor] Không thể xóa file original.mp4 gốc: ${unlinkError.message}`);
      }
      
      // Release R2 connection back to pool
      s3Pool.releaseConnection(s3);
      
    } catch (uploadError) {
      // Cập nhật metadata khi lỗi upload
      await updateJobMetadata({
        status: 'error',
        error: `Failed to upload files: ${uploadError.message}`
      });
      
      // Release R2 connection even on error
      s3Pool.releaseConnection(s3);
      
      throw uploadError;
    }
    
    // Gửi callback nếu có
    if (callbackUrl) {
      await sendCallback('completed');
    }
    
    // Đảm bảo process exit sau khi tất cả các thao tác bất đồng bộ hoàn tất
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[HLS Processor] Xử lý HLS hoàn tất. Thoát với mã 0`);
    process.exit(0);
  } catch (error) {
    console.error(`[HLS Processor] Lỗi: ${error.message}`);
    
    // Cập nhật metadata khi có lỗi
    await updateJobMetadata({
      status: 'error',
      error: error.message
    });
    
    // Gửi callback báo lỗi nếu có
    if (callbackUrl) {
      await sendCallback('error', error.message);
    }
    
    // Đảm bảo process exit sau khi callback hoàn tất
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.error(`[HLS Processor] Thoát với mã 1 do lỗi`);
    process.exit(1);
  }
}

// Hàm lấy thông tin video
function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    console.log(`[HLS Processor] Chạy ffprobe: ${file}`);
    
    // Kiểm tra file một lần nữa
    if (!fs.existsSync(file)) {
      return reject(new Error(`File không tồn tại: ${file}`));
    }
    
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file
    ]);
    
    let output = '';
    let errorOutput = '';
    
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`[ffprobe] ${data.toString()}`);
    });
    
    ffprobe.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        resolve(duration);
      } else {
        console.error(`[ffprobe] Lỗi code ${code}, stderr: ${errorOutput}`);
        reject(new Error(`ffprobe exited with code ${code} ${errorOutput}`));
      }
    });
  });
}

// Hàm xử lý một độ phân giải và trả về thông tin cho master playlist
async function processResolution(resolution, duration, completedResolutions, resolutionsToUse, processDir) {
  const { height, bitrate } = resolution;
  return new Promise((resolve, reject) => {
    console.log(`[HLS Processor] Đang xử lý độ phân giải ${height}p với bitrate ${bitrate}`);
    
    const outputFile = path.join(processDir, `${height}p.m3u8`);
    
    // Lấy thông tin video gốc để tính toán width
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'csv=p=0',
      inputFile
    ]);

    let dimensions = '';
    let ffprobeError = '';
    
    ffprobe.stdout.on('data', (data) => {
      dimensions += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      ffprobeError += data.toString();
    });

    ffprobe.on('close', async (code) => {
      if (code !== 0) {
        return reject(new Error(`Failed to get video dimensions: ${ffprobeError}`));
      }

      const [originalWidth, originalHeight] = dimensions.trim().split(',').map(Number);
      
      // Tính toán width mới và đảm bảo chia hết cho 2
      let width = Math.round((originalWidth / originalHeight) * height);
      width = Math.floor(width / 2) * 2; // Làm tròn xuống số chẵn gần nhất
      
      // Đảm bảo width tối thiểu là 2 pixel
      width = Math.max(2, width);
      
      console.log(`[HLS Processor] Original dimensions: ${originalWidth}x${originalHeight}`);
      console.log(`[HLS Processor] Target dimensions for ${height}p: ${width}x${height}`);

      // Reset error output for this resolution
      ffmpegErrorOutput = '';

      // Command ffmpeg để chuyển đổi video sang HLS với fMP4
      const ffmpeg = spawn('ffmpeg', [
        '-y',  // Tự động ghi đè file nếu tồn tại
        '-i', inputFile,
        '-profile:v', 'main',
        '-vf', `scale=${width}:${height}`,
        '-c:v', 'h264',
        '-crf', '23',
        '-b:v', bitrate,
        '-maxrate', bitrate,
        '-bufsize', `${parseInt(bitrate) * 2}`,
        '-c:a', 'aac',
        '-ar', '48000',
        '-b:a', '128k',
        '-hls_time', HLS_SEGMENT_DURATION,
        '-hls_list_size', '0',
        '-hls_segment_type', 'fmp4',
        '-hls_fmp4_init_filename', `init-${height}p.mp4`,
        '-hls_segment_filename', path.join(processDir, `segment_${height}p_%03d.m4s`),
        outputFile
      ]);
      
      // Giám sát tiến độ và lỗi ffmpeg
      let progressPattern = /time=(\d+:\d+:\d+.\d+)/;
      let lastProgress = 0;

      ffmpeg.stderr.on('data', async (data) => {
        const dataString = data.toString();
        // Lưu lại output để debug
        ffmpegErrorOutput += dataString;
        
        const match = progressPattern.exec(dataString);
        if (match) {
          const timeStr = match[1];
          // Chuyển định dạng HH:MM:SS.MS sang giây
          const timeParts = timeStr.split(':');
          const progressSeconds = 
            parseFloat(timeParts[0]) * 3600 + 
            parseFloat(timeParts[1]) * 60 + 
            parseFloat(timeParts[2]);
          
          // Tính phần trăm tiến độ cho độ phân giải hiện tại
          const currentProgress = Math.round((progressSeconds / duration) * 100);
          
          // Chỉ cập nhật khi tiến độ thay đổi đáng kể (mỗi 10%)
          if (currentProgress % 10 === 0 && currentProgress !== lastProgress) {
            lastProgress = currentProgress;
            
            // Tính toán tổng tiến độ dựa trên số lượng độ phân giải đã hoàn thành
            const totalProgress = Math.round(
              ((completedResolutions * 100) + currentProgress) / resolutionsToUse.length
            );
            
            // Cập nhật metadata với tiến độ mới
            await updateJobMetadata({
              status: 'processing',
              progress: totalProgress,
              currentResolution: `${height}p`,
              resolutionProgress: currentProgress
            });
          }
        }
      });
      
      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          console.log(`[HLS Processor] Độ phân giải ${height}p hoàn tất`);
          
          try {
            // Kiểm tra file playlist và segments đã được tạo
            if (!fs.existsSync(outputFile)) {
              reject(new Error(`Playlist file was not created: ${outputFile}`));
              return;
            }

            // Đọc nội dung playlist
            let playlistContent = fs.readFileSync(outputFile, 'utf8');
            
            // Thêm #EXT-X-MAP nếu chưa có
            if (!playlistContent.includes('#EXT-X-MAP')) {
              playlistContent = playlistContent.replace('#EXTINF', 
                `#EXT-X-MAP:URI="init-${height}p.mp4"\n#EXTINF`);
            }
            
            // Thêm #EXT-X-ENDLIST nếu chưa có
            if (!playlistContent.endsWith('#EXT-X-ENDLIST\n')) {
              playlistContent += '\n#EXT-X-ENDLIST\n';
            }
            
            // Ghi lại playlist
            fs.writeFileSync(outputFile, playlistContent);
            
            // Kiểm tra các segment files
            const segmentPattern = new RegExp(`segment_${height}p_\\d+\\.m4s`);
            const files = fs.readdirSync(processDir);
            const segments = files.filter(f => segmentPattern.test(f));
            
            if (segments.length === 0) {
              reject(new Error(`No segment files were created for ${height}p`));
              return;
            }

            console.log(`[HLS Processor] Created ${segments.length} segments for ${height}p`);
            
            // Trả về thông tin cho master playlist
            resolve({
              bandwidth: parseInt(bitrate) * 1000,
              width,
              height,
              filename: `${height}p.m3u8`
            });
          } catch (error) {
            reject(new Error(`Failed to process playlist for ${height}p: ${error.message}`));
          }
        } else {
          const errorMessage = `ffmpeg exited with code ${code} for ${height}p. Error output:\n${ffmpegErrorOutput}`;
          console.error(`[HLS Processor] ${errorMessage}`);
          reject(new Error(errorMessage));
        }
      });
    });
  });
}

// Hàm upload một file lên R2 với retry và timeout
async function uploadFileToR2(filePath, r2Key, retryCount = 0) {
  // Xác định ContentType dựa vào phần mở rộng
  let contentType = 'application/octet-stream';
  if (r2Key.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
  else if (r2Key.endsWith('.ts')) contentType = 'video/MP2T';
  else if (r2Key.endsWith('.m4s')) contentType = 'video/iso.segment';
  else if (r2Key.endsWith('.mp4')) contentType = 'video/mp4';
  else if (r2Key.endsWith('.jpg')) contentType = 'image/jpeg';
  
  console.log(`[HLS Processor] Uploading ${filePath} to R2: ${r2Key} (${contentType}) - Attempt ${retryCount + 1}`);
  
  try {
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      throw new Error(`File không tồn tại: ${filePath}`);
    }

    // Đọc file và kiểm tra kích thước
    const fileContent = fs.readFileSync(filePath);
    console.log(`[HLS Processor] File size: ${fileContent.length} bytes`);

    // Upload lên R2 với timeout
    const uploadPromise = s3.putObject({
      Bucket: r2Bucket,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType
    }).promise();
    
    // Thêm timeout cho upload
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout')), CONFIG.UPLOAD_TIMEOUT);
    });
    
    await Promise.race([uploadPromise, timeoutPromise]);
    
    // Kiểm tra file đã upload thành công
    try {
      const headResult = await s3.headObject({
        Bucket: r2Bucket,
        Key: r2Key
      }).promise();
      
      console.log(`[HLS Processor] Uploaded successfully: ${r2Key}`);
      console.log(`[HLS Processor] R2 object size: ${headResult.ContentLength} bytes`);
      
      // Verify file size
      if (headResult.ContentLength !== fileContent.length) {
        throw new Error(`Size mismatch: local ${fileContent.length}, R2 ${headResult.ContentLength}`);
      }
    } catch (headError) {
      throw new Error(`File uploaded but not accessible: ${headError.message}`);
    }
  } catch (error) {
    console.error(`[HLS Processor] Upload error for ${r2Key}: ${error.message}`);
    
    // Retry logic
    if (retryCount < CONFIG.RETRY_ATTEMPTS - 1) {
      console.log(`[HLS Processor] Retrying upload for ${r2Key} in ${CONFIG.RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return uploadFileToR2(filePath, r2Key, retryCount + 1);
    }
    
    throw new Error(`Failed to upload ${path.basename(filePath)} after ${CONFIG.RETRY_ATTEMPTS} attempts: ${error.message}`);
  }
}

// Hàm upload nhiều files với giới hạn concurrent
async function uploadFilesWithLimit(uploadTasks) {
  const results = [];
  
  for (let i = 0; i < uploadTasks.length; i += CONFIG.MAX_CONCURRENT_UPLOADS) {
    const batch = uploadTasks.slice(i, i + CONFIG.MAX_CONCURRENT_UPLOADS);
    console.log(`[HLS Processor] Uploading batch ${Math.floor(i/CONFIG.MAX_CONCURRENT_UPLOADS) + 1}, ${batch.length} files`);
    
    const batchResults = await Promise.all(
      batch.map(task => task.uploadPromise.catch(error => ({ error, task })))
    );
    
    // Kiểm tra lỗi trong batch
    const errors = batchResults.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Upload batch failed: ${errors.map(e => e.error.message).join(', ')}`);
    }
    
    results.push(...batchResults);
    
    // Delay nhỏ giữa các batch để tránh overwhelm R2
    if (i + CONFIG.MAX_CONCURRENT_UPLOADS < uploadTasks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Gửi callback
async function sendCallback(status, error = null) {
  try {
    console.log(`[HLS Processor] Gửi callback đến ${callbackUrl}`);
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Backend-Secret': 'alldrama-backend-secret'
          },
          body: JSON.stringify({
            status,
            movieId,
            episodeId,
            error
          }),
          timeout: 10000 // 10 seconds timeout
        });
        
        if (response.ok) {
          console.log(`[HLS Processor] Callback gửi thành công, phản hồi: ${response.status}`);
          return;
        }
        
        console.warn(`[HLS Processor] Callback gửi không thành công, mã phản hồi: ${response.status}`);
      } catch (err) {
        console.error(`[HLS Processor] Lỗi gửi callback: ${err.message}`);
      }
      
      retries++;
      if (retries < maxRetries) {
        const delayMs = retries * 2000; // 2s, 4s, 6s...
        console.log(`[HLS Processor] Thử lại lần ${retries} sau ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.error(`[HLS Processor] Không thể gửi callback sau ${maxRetries} lần thử`);
  } catch (error) {
    console.error(`[HLS Processor] Lỗi gửi callback: ${error.message}`);
  }
}

// Khởi động xử lý
processHLS().catch(error => {
  console.error(`[HLS Processor] Lỗi không xử lý được: ${error.message}`);
  process.exit(1);
}); 