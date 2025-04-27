# API Quản lý Media

## API Upload Media

### Upload poster cho phim

```
POST /api/media/movies/:movieId/poster
```

**Mô tả**: Upload file poster cho phim

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Path Parameters**:

- `movieId`: ID của phim

**Form Data**:

- `poster`: File hình ảnh (JPG, PNG)

**Response (200 - OK)**:

```json
{
  "message": "Upload poster thành công",
  "url": "https://cdn.example.com/movies/123/poster.jpg"
}
```

**Lỗi**:

- 400: Không tìm thấy file
- 401: Không được xác thực
- 403: Không có quyền
- 500: Lỗi máy chủ

### Upload backdrop cho phim

```
POST /api/media/movies/:movieId/backdrop
```

**Mô tả**: Upload file backdrop cho phim

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Path Parameters**:

- `movieId`: ID của phim

**Form Data**:

- `backdrop`: File hình ảnh (JPG, PNG)

**Response (200 - OK)**:

```json
{
  "message": "Upload backdrop thành công",
  "url": "https://cdn.example.com/movies/123/backdrop.jpg"
}
```

**Lỗi**:

- 400: Không tìm thấy file
- 401: Không được xác thực
- 403: Không có quyền
- 500: Lỗi máy chủ

### Upload trailer cho phim

```
POST /api/media/movies/:movieId/trailer
```

**Mô tả**: Upload file trailer cho phim

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Path Parameters**:

- `movieId`: ID của phim

**Form Data**:

- `trailer`: File video (MP4, WebM)

**Response (200 - OK)**:

```json
{
  "message": "Upload trailer thành công",
  "trailerUrl": "https://cdn.example.com/movies/123/trailer.mp4"
}
```

**Lỗi**:

- 400: Không tìm thấy file
- 401: Không được xác thực
- 403: Không có quyền
- 500: Lỗi máy chủ

### Upload video cho tập phim

```
POST /api/media/episodes/:movieId/:episodeId/video
```

**Mô tả**: Upload file video cho tập phim và bắt đầu xử lý HLS

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Path Parameters**:

- `movieId`: ID của phim
- `episodeId`: ID của tập phim

**Form Data**:

- `video`: File video (MP4, WebM)

**Response (202 - Accepted)**:

```json
{
  "message": "Đã nhận video, đang xử lý HLS",
  "originalUrl": "https://cdn.example.com/episodes/123/456/original.mp4",
  "thumbnailUrl": "https://cdn.example.com/episodes/123/456/thumbnail.jpg",
  "processingStatus": "processing",
  "estimatedDuration": 1800
}
```

**Lỗi**:

- 400: Không tìm thấy file
- 401: Không được xác thực
- 403: Không có quyền
- 500: Lỗi máy chủ

### Lấy presigned URL để upload trực tiếp

```
POST /api/media/presigned-url
```

**Mô tả**: Tạo presigned URL để upload file trực tiếp lên R2 Storage

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:

```json
{
  "movieId": 123,
  "episodeId": 456,
  "fileType": "video"
}
```

**Loại fileType hỗ trợ**:

- `poster`: Poster của phim
- `backdrop`: Backdrop của phim
- `trailer`: Trailer của phim
- `video`: Video của tập phim (cần thêm episodeId)
- `thumbnail`: Thumbnail của tập phim (cần thêm episodeId)

**Response (200 - OK)**:

```json
{
  "presignedUrl": "https://storage.example.com/upload-url?token=xyz",
  "contentType": "video/mp4",
  "cdnUrl": "https://cdn.example.com/",
  "expiresIn": 10800
}
```

**Lỗi**:

- 400: Thiếu thông tin cần thiết
- 401: Không được xác thực
- 403: Không có quyền
- 500: Lỗi máy chủ

## API Xử lý và Quản lý Video

### Xóa media

```
DELETE /api/media/movies/:movieId/:mediaType
```

**Mô tả**: Xóa một file media cụ thể của phim

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `movieId`: ID của phim
- `mediaType`: Loại media (`poster`, `backdrop`, `trailer`)

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Đã xóa media thành công"
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền
- 500: Lỗi máy chủ

### Xóa tập phim

```
DELETE /api/media/episodes/:movieId/:episodeId
```

**Mô tả**: Xóa một tập phim và tất cả file liên quan

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `movieId`: ID của phim
- `episodeId`: ID của tập phim

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Đã xóa tập phim thành công"
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền
- 404: Không tìm thấy tập phim
- 500: Lỗi máy chủ

### Xóa phim

```
DELETE /api/media/movies/:movieId
```

**Mô tả**: Xóa một phim và tất cả tập phim, file liên quan

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `movieId`: ID của phim

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Đã xóa phim và tất cả tập phim thành công"
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền
- 404: Không tìm thấy phim
- 500: Lỗi máy chủ

### Kiểm tra trạng thái xử lý video

```
GET /api/media/episodes/:episodeId/processing-status
```

**Mô tả**: Kiểm tra trạng thái xử lý HLS cho video của tập phim

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `episodeId`: ID của tập phim

**Response (200 - OK)**:

```json
{
  "episodeId": 456,
  "isProcessed": true,
  "processingError": null,
  "playlistUrl": "https://cdn.example.com/episodes/123/456/hls/master.m3u8",
  "thumbnailUrl": "https://cdn.example.com/episodes/123/456/thumbnail.jpg"
}
```

**Lỗi**:

- 401: Không được xác thực
- 404: Không tìm thấy tập phim
- 500: Lỗi máy chủ

### Xử lý video (từ worker)

```
POST /api/media/process-video
```

**Mô tả**: API nội bộ được gọi bởi Cloudflare Worker để bắt đầu quá trình xử lý HLS

**Headers**:

```
X-Worker-Secret: {workerSecret}
Content-Type: application/json
```

**Request Body**:

```json
{
  "videoKey": "episodes/123/456/original.mp4",
  "movieId": 123,
  "episodeId": 456,
  "jobId": "job-12345",
  "callbackUrl": "https://worker.example.com/api/hls-callback/job-12345"
}
```

**Response (200 - OK)**:

```json
{
  "success": true,
  "jobId": "job-12345",
  "error": null
}
```

**Lỗi**:

- 400: Thiếu thông tin cần thiết
- 401: Không được xác thực
- 500: Lỗi máy chủ

## Cloudflare Worker API

### Upload file lên R2

```
POST https://worker.example.com/api/upload
```

**Mô tả**: Upload file trực tiếp lên Cloudflare R2 Storage

**Headers**:

```
Authorization: Bearer {apiKey}
Content-Type: multipart/form-data
```

**Form Data**:

- `file`: File cần upload
- `path`: (Tùy chọn) Đường dẫn lưu trữ
- `fileName`: (Tùy chọn) Tên file, mặc định là tên file gốc

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Upload thành công",
  "url": "https://cdn.example.com/path/filename.ext",
  "key": "path/filename.ext"
}
```

**Lỗi**:

- 400: Không tìm thấy file
- 401: Không được xác thực
- 500: Lỗi máy chủ

### Tạo job chuyển đổi HLS

```
POST https://worker.example.com/api/convert-hls
```

**Mô tả**: Tạo job để chuyển đổi video gốc sang định dạng HLS

**Headers**:

```
Authorization: Bearer {apiKey}
Content-Type: application/json
```

**Request Body**:

```json
{
  "videoKey": "episodes/123/456/original.mp4",
  "movieId": 123,
  "episodeId": 456
}
```

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Job chuyển đổi HLS đã được tạo",
  "jobId": "hls-job-12345",
  "hlsPath": "episodes/123/456/hls/master.m3u8",
  "hlsUrl": "https://cdn.example.com/hls/episodes/123/456/hls/master.m3u8",
  "status": "pending"
}
```

**Lỗi**:

- 400: Thiếu thông tin cần thiết
- 401: Không được xác thực
- 500: Lỗi máy chủ

### Callback từ xử lý HLS

```
POST https://worker.example.com/api/hls-callback/:jobId
```

**Mô tả**: Callback được gọi bởi Backend API khi quá trình xử lý HLS hoàn tất

**Headers**:

```
X-Backend-Secret: {backendSecret}
Content-Type: application/json
```

**Path Parameters**:

- `jobId`: ID của job xử lý HLS

**Request Body**:

```json
{
  "status": "completed",
  "movieId": 123,
  "episodeId": 456,
  "error": null
}
```

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái job",
  "jobId": "hls-job-12345",
  "status": "completed"
}
```

**Lỗi**:

- 400: Thiếu thông tin cần thiết
- 401: Không được xác thực
- 404: Không tìm thấy job
- 500: Lỗi máy chủ

### Kiểm tra trạng thái job HLS

```
GET https://worker.example.com/api/hls-status/:jobId/:movieId/:episodeId
```

**Mô tả**: Kiểm tra trạng thái của job xử lý HLS

**Path Parameters**:

- `jobId`: ID của job
- `movieId`: ID của phim
- `episodeId`: ID của tập phim

**Response (200 - OK)**:

```json
{
  "success": true,
  "jobId": "hls-job-12345",
  "status": "completed",
  "videoKey": "episodes/123/456/original.mp4",
  "movieId": 123,
  "episodeId": 456,
  "hlsPath": "episodes/123/456/hls/master.m3u8",
  "hlsUrl": "https://cdn.example.com/hls/episodes/123/456/hls/master.m3u8",
  "createdAt": "2023-05-01T12:00:00.000Z",
  "updatedAt": "2023-05-01T12:10:00.000Z"
}
```

**Lỗi**:

- 400: Thiếu job ID
- 404: Không tìm thấy job
- 500: Lỗi máy chủ

### Liệt kê các file trong R2

```
GET https://worker.example.com/list-r2/:prefix
```

**Mô tả**: Liệt kê các file trong R2 Storage theo prefix (hữu ích để debug)

**Path Parameters**:

- `prefix`: Tiền tố đường dẫn cần liệt kê

**Response (200 - OK)**:

```json
{
  "success": true,
  "prefix": "episodes/123/456/",
  "files": [
    {
      "key": "episodes/123/456/original.mp4",
      "size": 1234567,
      "uploadedAt": "2023-05-01T12:00:00.000Z"
    },
    {
      "key": "episodes/123/456/thumbnail.jpg",
      "size": 12345,
      "uploadedAt": "2023-05-01T12:00:00.000Z"
    }
  ]
}
```

**Lỗi**:

- 500: Lỗi máy chủ

### Xem streaming video HLS

```
GET https://worker.example.com/hls/:path
```

**Mô tả**: Stream video HLS từ R2 Storage

**Path Parameters**:

- `path`: Đường dẫn đến file HLS (ví dụ: episodes/123/456/hls/master.m3u8)

**Response (200 - OK)**:

- Trả về nội dung file HLS với header phù hợp

**Lỗi**:

- 404: Không tìm thấy file
- 500: Lỗi máy chủ
