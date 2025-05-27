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

// Cấu hình R2
const s3 = new AWS.S3({
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  accessKeyId: r2AccessKey,
  secretAccessKey: r2Secret,
  signatureVersion: 'v4',
  region: 'auto'
});

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

// Chuyển đổi video sang HLS với fMP4
async function processHLS() {
  try {
    console.log(`[HLS Processor] Bắt đầu xử lý: ${inputFile}`);
    
    // Tạo thư mục đầu ra nếu chưa tồn tại
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Lấy thông tin video để quyết định độ phân giải
    console.log(`[HLS Processor] Đang lấy thông tin video...`);
    const duration = await getVideoDuration(inputFile);
    console.log(`[HLS Processor] Video có thời lượng: ${duration} giây`);
    
    // Nếu video dài hơn 20 phút, sử dụng ít độ phân giải hơn
    const resolutionsToUse = duration > 1200 ? REDUCED_RESOLUTIONS : RESOLUTIONS;
    console.log(`[HLS Processor] Sử dụng ${resolutionsToUse.length} độ phân giải`);
    
    // Khởi tạo master playlist
    let masterPlaylistContent = '#EXTM3U\n';
    masterPlaylistContent += '#EXT-X-VERSION:7\n';
    masterPlaylistContent += '#EXT-X-INDEPENDENT-SEGMENTS\n';
    
    // Xử lý từng độ phân giải và thu thập thông tin cho master playlist
    const streamInfos = [];
    for (const resolution of resolutionsToUse) {
      const streamInfo = await processResolution(resolution);
      streamInfos.push(streamInfo);
    }
    
    // Thêm thông tin stream vào master playlist theo thứ tự bitrate tăng dần
    streamInfos
      .sort((a, b) => parseInt(a.bandwidth) - parseInt(b.bandwidth))
      .forEach(({ bandwidth, width, height, filename }) => {
        masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`;
        masterPlaylistContent += `${filename}\n`;
      });
    
    // Ghi master playlist sau khi đã có đầy đủ thông tin
    const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
    fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);
    console.log(`[HLS Processor] Đã tạo master playlist với ${streamInfos.length} streams`);
    
    // Kiểm tra nội dung master playlist
    const masterContent = fs.readFileSync(masterPlaylistPath, 'utf8');
    console.log(`[HLS Processor] Nội dung master playlist:\n${masterContent}`);
    
    // Upload toàn bộ thư mục HLS lên R2
    console.log(`[HLS Processor] Bắt đầu upload thư mục HLS lên R2`);
    const r2HlsPath = `episodes/${movieId}/${episodeId}/hls`;
    
    try {
      // Upload tất cả file khác trước master.m3u8
      const files = fs.readdirSync(outputDir).filter(f => f !== 'master.m3u8');
      for (const file of files) {
        await uploadFileToR2(path.join(outputDir, file), `${r2HlsPath}/${file}`);
      }
      
      // Upload master.m3u8 cuối cùng
      await uploadFileToR2(masterPlaylistPath, `${r2HlsPath}/master.m3u8`);
      
      console.log(`[HLS Processor] Upload hoàn tất`);
    } catch (uploadError) {
      throw new Error(`Failed to upload files: ${uploadError.message}`);
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
async function processResolution(resolution) {
  const { height, bitrate } = resolution;
  return new Promise((resolve, reject) => {
    console.log(`[HLS Processor] Đang xử lý độ phân giải ${height}p với bitrate ${bitrate}`);
    
    const outputFile = path.join(outputDir, `${height}p.m3u8`);
    
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

      // Thêm -vf "scale=w=trunc(oh*a/2)*2:h=trunc(ih*240/ih/2)*2" để đảm bảo kích thước luôn chẵn
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputFile,
        '-profile:v', 'main',
        '-vf', `scale=w=trunc(oh*a/2)*2:h=${height}`,
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
        '-hls_segment_filename', path.join(outputDir, `segment_${height}p_%03d.m4s`),
        '-y', // Ghi đè file nếu tồn tại
        outputFile
      ]);
      
      // Giám sát tiến độ và lỗi ffmpeg
      let progressPattern = /time=(\d+:\d+:\d+.\d+)/;
      ffmpeg.stderr.on('data', (data) => {
        const dataString = data.toString();
        // Lưu lại output để debug
        ffmpegErrorOutput += dataString;
        
        const match = progressPattern.exec(dataString);
        if (match) {
          console.log(`[ffmpeg-${height}p] Progress: ${match[1]}`);
        } else {
          // Log các thông báo không phải progress
          console.log(`[ffmpeg-${height}p] ${dataString.trim()}`);
        }
      });
      
      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          console.log(`[HLS Processor] Độ phân giải ${height}p hoàn tất`);
          
          try {
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

// Hàm upload một file lên R2
async function uploadFileToR2(filePath, r2Key) {
  // Xác định ContentType dựa vào phần mở rộng
  let contentType = 'application/octet-stream';
  if (r2Key.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
  else if (r2Key.endsWith('.ts')) contentType = 'video/MP2T';
  else if (r2Key.endsWith('.m4s')) contentType = 'video/iso.segment';
  else if (r2Key.endsWith('.mp4')) contentType = 'video/mp4';
  
  console.log(`[HLS Processor] Uploading ${path.basename(filePath)} to ${r2Key}`);
  
  try {
    await s3.putObject({
      Bucket: r2Bucket,
      Key: r2Key,
      Body: fs.readFileSync(filePath),
      ContentType: contentType
    }).promise();
    
    console.log(`[HLS Processor] Uploaded ${path.basename(filePath)} successfully`);
  } catch (error) {
    throw new Error(`Failed to upload ${path.basename(filePath)}: ${error.message}`);
  }
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