# Luồng xử lý upload media

## 1. Luồng xử lý thêm phim mới

### 1.1. Upload poster và backdrop

#### Bước 1: Lấy presigned URL

- **API**: `POST /api/media/presigned-url`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}
  ```
- **Request Body**:
  ```json
  {
    "movieId": null,
    "fileType": "poster" // hoặc "backdrop"
  }
  ```
- **Response**:
  ```json
  {
    "presignedUrl": "https://storage.example.com/upload-url?token=xyz",
    "contentType": "image/jpeg",
    "cdnUrl": "https://cdn.example.com/",
    "expiresIn": 3600
  }
  ```

#### Bước 2: Upload file

- Sử dụng presigned URL để upload file trực tiếp lên R2 Storage
- Đảm bảo set đúng Content-Type khi upload

### 1.2. Tạo phim mới

#### Bước 1: Gọi API tạo phim

- **API**: `POST /api/movies`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}
  ```
- **Request Body**:
  ```json
  {
    "title": "Tên phim",
    "summary": "Mô tả phim",
    "releaseYear": 2024,
    "duration": 7200,
    "posterUrl": "https://cdn.example.com/movies/{movieId}/poster.jpg",
    "backdropUrl": "https://cdn.example.com/movies/{movieId}/backdrop.jpg",
    "genreIds": [1, 2, 3]
  }
  ```

### 1.3. Upload trailer (tùy chọn)

#### Bước 1: Lấy presigned URL cho trailer

- **API**: `POST /api/media/presigned-url`
- **Request Body**:
  ```json
  {
    "movieId": "{movieId}",
    "fileType": "trailer"
  }
  ```

#### Bước 2: Upload và cập nhật

- Upload trailer lên R2 qua presigned URL
- Trailer URL sẽ tự động được cập nhật vào thông tin phim

## 2. Luồng xử lý thêm tập phim mới

### 2.1. Tạo tập phim

#### Bước 1: Gọi API tạo tập phim

- **API**: `POST /api/episodes`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {accessToken}
  ```
- **Request Body**:
  ```json
  {
    "movieId": 1,
    "episodeNumber": 1,
    "title": "Tên tập 1",
    "description": "Mô tả tập phim"
  }
  ```

### 2.2. Upload video

#### Bước 1: Lấy presigned URL cho video

- **API**: `POST /api/media/presigned-url`
- **Request Body**:
  ```json
  {
    "movieId": 1,
    "episodeId": 1,
    "fileType": "video"
  }
  ```
- **Response**:
  ```json
  {
    "presignedUrl": "https://storage.example.com/upload-url?token=xyz",
    "contentType": "video/mp4",
    "cdnUrl": "https://cdn.example.com/",
    "expiresIn": 10800 // 3 giờ cho video
  }
  ```

#### Bước 2: Upload video

- Upload video lên R2 qua presigned URL
- Thời gian upload phụ thuộc vào kích thước file

### 2.3. Xử lý HLS

#### Bước 1: Xử lý tự động

Sau khi upload thành công, hệ thống sẽ tự động:

1. Tạo thumbnail từ video
2. Chuyển đổi video sang các độ phân giải:
   - 240p (400kbps)
   - 360p (700kbps)
   - 480p (1500kbps)
   - 720p (2500kbps)
   - 1080p (4500kbps)
3. Tạo các file HLS:
   - master playlist (master.m3u8)
   - playlist cho từng độ phân giải
   - file khởi tạo (init-{quality}.mp4)
   - các segment video (segment*{quality}*{index}.m4s)

#### Bước 2: Kiểm tra trạng thái

- **API**: `GET /api/media/episodes/{episodeId}/processing-status`
- **Response**:
  ```json
  {
    "episodeId": 1,
    "isProcessed": true,
    "processingError": null,
    "playlistUrl": "https://cdn.example.com/episodes/1/1/hls/master.m3u8",
    "thumbnailUrl": "https://cdn.example.com/episodes/1/1/thumbnail.jpg"
  }
  ```

## 3. Cấu trúc thư mục trên R2 Storage

```
/movies/
  /{movieId}/
    /poster.jpg
    /backdrop.jpg
    /trailer.mp4
/episodes/
  /{movieId}/
    /{episodeId}/
      /original.mp4
      /thumbnail.jpg
      /hls/
        /master.m3u8
        /240p.m3u8
        /360p.m3u8
        /480p.m3u8
        /720p.m3u8
        /1080p.m3u8
        /init-240p.mp4
        /init-360p.mp4
        /init-480p.mp4
        /init-720p.mp4
        /init-1080p.mp4
        /segment_240p_000.m4s
        /segment_240p_001.m4s
        ...
```

## 4. Lưu ý quan trọng

1. **Quyền truy cập**:

   - Tất cả các API upload đều yêu cầu quyền Admin
   - Xác thực thông qua token JWT

2. **Kiểm tra file**:

   - Kích thước tối đa:
     - Ảnh: 10MB
     - Video: 2GB
   - Định dạng cho phép:
     - Ảnh: jpg, jpeg, png
     - Video: mp4, webm

3. **Xử lý HLS**:

   - Thời gian xử lý: 2-10 phút tùy độ dài video
   - Video > 20 phút: chỉ tạo 2 độ phân giải (360p, 720p)
   - Segment duration: 6 giây
   - Format: fMP4 segments

4. **CDN và Caching**:

   - Tất cả media được phân phối qua Cloudflare CDN
   - Cache thời gian:
     - Ảnh: 7 ngày
     - Video segments: 30 ngày
     - Playlists: 1 phút

5. **Xử lý lỗi**:
   - Retry tự động khi upload thất bại (tối đa 3 lần)
   - Thông báo chi tiết qua API status
   - Log đầy đủ cho việc debug
