# HLS Processor cho Alldrama

Container chuyên dụng để xử lý video thành HLS (HTTP Live Streaming) cho ứng dụng Alldrama.

## Cách sử dụng

### Xây dựng image

```bash
cd hls-processor
docker build -t alldrama-hls-processor .
```

### Chạy container

```bash
docker run --rm \
  -v /đường/dẫn/đến/thư_mục/chứa/video:/input \
  -v /đường/dẫn/đến/thư_mục/đầu_ra:/output \
  --network host \
  --add-host=host.docker.internal:host-gateway \
  alldrama-hls-processor \
  /input/original.mp4 \
  /output \
  123 \
  456 \
  r2_account_id \
  r2_access_key \
  r2_secret_key \
  r2_bucket \
  http://127.0.0.1:5000/api/media/hls-processor/callback
```

### Các tham số

1. `/input/original.mp4`: Đường dẫn đến file video trong container
2. `/output`: Thư mục đầu ra trong container
3. `123`: Movie ID
4. `456`: Episode ID
5. `r2_account_id`: ID của tài khoản Cloudflare R2
6. `r2_access_key`: Access key của R2
7. `r2_secret_key`: Secret key của R2
8. `r2_bucket`: Tên bucket R2
9. `http://127.0.0.1:5000/api/media/hls-processor/callback`: URL callback khi xử lý xong

## Tính năng

- Chuyển đổi video thành định dạng HLS với fMP4 segments
- Tạo nhiều độ phân giải: 240p, 360p, 480p, 720p, 1080p
- Tự động giảm số lượng độ phân giải cho video dài (>20 phút)
- Upload kết quả lên Cloudflare R2
- Gửi callback khi hoàn tất hoặc gặp lỗi

## Khắc phục sự cố

### 1. File không tìm thấy

Nếu xuất hiện lỗi "No such file or directory":

```
[ffprobe] /input/original.mp4: No such file or directory
```

**Giải pháp**:

- Kiểm tra file có tồn tại trong thư mục nguồn trên máy chủ không
- Kiểm tra đường dẫn mount volume trong Docker có chính xác không
- Sử dụng đường dẫn tuyệt đối khi mount volume

### 2. Vấn đề kết nối callback

Nếu xuất hiện lỗi:

```
[HLS Processor] Lỗi gửi callback: getaddrinfo ENOTFOUND host.docker.internal
```

**Giải pháp**:

- Sử dụng tham số `--add-host=host.docker.internal:host-gateway`
- Sử dụng IP cục bộ (127.0.0.1) thay vì hostname
- Sử dụng `--network host` để container dùng mạng của máy chủ

### 3. Vấn đề quyền truy cập

Nếu container không thể đọc/ghi các file:

**Giải pháp**:

- Chạy container với user `root`
- Kiểm tra quyền của các thư mục được mount

### 4. Kiểm tra container

Để test container mà không thực sự xử lý:

```bash
# Từ thư mục hls-processor
docker-compose up test-run
```

## Quy trình Debug

1. Kiểm tra file đầu vào tồn tại:

   ```bash
   ls -la /path/to/temp/original.mp4
   ```

2. Kiểm tra file có thể đọc được bằng ffprobe:

   ```bash
   ffprobe -v error -show_format -show_streams /path/to/temp/original.mp4
   ```

3. Thử chạy container với flag -it để debug:

   ```bash
   docker run -it --rm \
     -v /path/to/temp:/input \
     -v /path/to/output:/output \
     alldrama-hls-processor \
     /bin/bash
   ```

4. Từ bên trong container, kiểm tra các thư mục và file:
   ```bash
   ls -la /input
   cat /input/original.mp4 | head -c 100 | hexdump -C
   ```
