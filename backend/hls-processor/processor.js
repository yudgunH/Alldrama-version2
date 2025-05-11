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
    
    // Tạo nội dung cho master playlist
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:7\n'; // Version 7 hỗ trợ fMP4
    
    // Xử lý từng độ phân giải
    for (const resolution of resolutionsToUse) {
      await processResolution(resolution, masterPlaylist);
    }
    
    // Ghi master playlist
    fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterPlaylist);
    console.log(`[HLS Processor] Đã tạo master playlist`);
    
    // Upload toàn bộ thư mục HLS lên R2
    console.log(`[HLS Processor] Bắt đầu upload thư mục HLS lên R2`);
    const r2HlsPath = `episodes/${movieId}/${episodeId}/hls`;
    await uploadDirectoryToR2(outputDir, r2HlsPath);
    
    console.log(`[HLS Processor] Upload hoàn tất`);
    
    // Gửi callback nếu có
    if (callbackUrl) {
      await sendCallback('completed');
    }
    
    console.log(`[HLS Processor] Xử lý HLS hoàn tất. Thoát với mã 0`);
    process.exit(0);
  } catch (error) {
    console.error(`[HLS Processor] Lỗi: ${error.message}`);
    
    // Gửi callback báo lỗi nếu có
    if (callbackUrl) {
      await sendCallback('error', error.message);
    }
    
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

// Hàm xử lý một độ phân giải
async function processResolution(resolution, masterPlaylist) {
  const { height, bitrate } = resolution;
  return new Promise((resolve, reject) => {
    console.log(`[HLS Processor] Đang xử lý độ phân giải ${height}p với bitrate ${bitrate}`);
    
    const outputFile = path.join(outputDir, `${height}p.m3u8`);
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputFile,
      '-profile:v', 'main',
      '-vf', `scale=-2:${height}`,
      '-c:v', 'h264',
      '-crf', '23',
      '-b:v', bitrate,
      '-c:a', 'aac',
      '-ar', '48000',
      '-b:a', '128k',
      '-hls_time', HLS_SEGMENT_DURATION,
      '-hls_list_size', '0',
      '-hls_segment_type', 'fmp4',
      '-hls_fmp4_init_filename', `init-${height}p.mp4`,
      '-hls_segment_filename', path.join(outputDir, `segment_${height}p_%03d.m4s`),
      outputFile
    ]);
    
    // Giám sát tiến độ ffmpeg
    let progressPattern = /time=(\d+:\d+:\d+.\d+)/;
    ffmpeg.stderr.on('data', (data) => {
      const dataString = data.toString();
      const match = progressPattern.exec(dataString);
      if (match) {
        console.log(`[ffmpeg-${height}p] Progress: ${match[1]}`);
      }
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`[HLS Processor] Độ phân giải ${height}p hoàn tất`);
        
        // Thêm vào master playlist
        masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(bitrate) * 1000},RESOLUTION=${height}p\n`;
        masterPlaylist += `${height}p.m3u8\n`;
        
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code} for ${height}p`));
      }
    });
  });
}

// Upload thư mục lên R2
async function uploadDirectoryToR2(localDir, r2Prefix) {
  const files = fs.readdirSync(localDir);
  console.log(`[HLS Processor] Đang upload ${files.length} files lên prefix ${r2Prefix}`);
  
  for (const file of files) {
    const filePath = path.join(localDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      // Xác định ContentType dựa vào phần mở rộng
      let contentType = 'application/octet-stream';
      if (file.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
      else if (file.endsWith('.ts')) contentType = 'video/MP2T';
      else if (file.endsWith('.m4s')) contentType = 'video/iso.segment';
      else if (file.endsWith('.mp4')) contentType = 'video/mp4';
      
      // Upload file
      const r2Key = `${r2Prefix}/${file}`;
      
      console.log(`[HLS Processor] Uploading ${file} to ${r2Key}`);
      
      try {
        await s3.putObject({
          Bucket: r2Bucket,
          Key: r2Key,
          Body: fs.readFileSync(filePath),
          ContentType: contentType
        }).promise();
        
        console.log(`[HLS Processor] Uploaded ${file}`);
      } catch (error) {
        console.error(`[HLS Processor] Error uploading ${file}: ${error.message}`);
        throw error;
      }
    }
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