# HLS Processor Container

Container Docker chuyên dụng để xử lý video HLS cho Alldrama, hoạt động độc lập với backend.

## Tính năng

- Xử lý video MP4 thành định dạng HLS
- Hỗ trợ nhiều độ phân giải khác nhau (240p, 360p, 480p, 720p, 1080p)
- Tối ưu hóa bitrate cho mỗi độ phân giải
- Tự động upload các file HLS lên Cloudflare R2
- Gửi callback về backend khi hoàn thành
- Tự động xóa container sau khi xử lý xong để tiết kiệm tài nguyên

## Cài đặt và cấu hình

### 1. Biến môi trường

Đảm bảo các biến môi trường sau đã được đặt trong file `.env` của backend:

```
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY=your-r2-access-key
R2_SECRET_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name

# Worker Configuration
WORKER_DOMAIN=media.alldrama.tech

# Backend Configuration
BACKEND_URL=https://alldramaz.com
WORKER_SECRET=alldrama-worker-secret
```

### 2. Xây dựng image Docker

Vào thư mục `hls-processor` và xây dựng Docker image:

```bash
cd hls-processor
docker build -t alldrama-hls-processor .
```

Hoặc sử dụng script npm từ thư mục gốc:

```bash
npm run hls:build
```

## Quy trình làm việc

### 1. Upload video qua CF-Worker

Người dùng upload video qua API Worker, video được lưu vào R2 Bucket.

### 2. Xử lý HLS tự động

- CF-Worker gọi API backend để bắt đầu xử lý
- Backend tải video từ R2 về máy chủ
- Backend khởi động container Docker để xử lý
- Container xử lý video thành HLS với nhiều độ phân giải
- Container upload kết quả lên R2
- Container gửi callback về backend khi hoàn thành
- Backend cập nhật trạng thái tập phim

### 3. Theo dõi trạng thái

Trạng thái xử lý có thể được kiểm tra qua endpoint:
`/api/media/episodes/:episodeId/processing-status`

## Khắc phục sự cố

### Docker không chạy

Đảm bảo Docker Desktop đang chạy trên máy chủ. Nếu không, khởi động với:

```bash
# Windows
start "Docker Desktop"

# Linux
systemctl start docker
```

### Vấn đề quyền truy cập

Nếu có lỗi quyền truy cập thư mục, đảm bảo các thư mục `temp` và `output` có quyền ghi:

```bash
# Windows
icacls hls-processor\temp /grant:r Everyone:(OI)(CI)F
icacls hls-processor\output /grant:r Everyone:(OI)(CI)F

# Linux
chmod -R 777 hls-processor/temp
chmod -R 777 hls-processor/output
```

### Kiểm tra logs

Để xem logs của container:

```bash
docker logs $(docker ps -a -q --filter "name=hls-processor")
```

## Tham số chi tiết

Khi chạy container trực tiếp:

```bash
docker run --rm -v "/path/to/input:/input" -v "/path/to/output:/output" alldrama-hls-processor /input/video.mp4 /output movie_id episode_id r2_account_id r2_access_key r2_secret r2_bucket callback_url
```

## Điều chỉnh số lượng độ phân giải

- Video ngắn (< 20 phút): 240p, 360p, 480p, 720p, 1080p
- Video dài (> 20 phút): 360p, 720p
