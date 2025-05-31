# Alldrama Media Service

Dịch vụ xử lý media cho hệ thống Alldrama, chạy trên Cloudflare Workers và R2.

## Tính năng

- Upload files lên R2 Storage
- Phục vụ nội dung HLS (HTTP Live Streaming) cho phát video
- Quản lý job chuyển đổi video sang định dạng HLS
- Điều chỉnh kích thước hình ảnh
- Xem và quản lý nội dung trên R2

## API Endpoints

### Upload File

```
POST /api/upload
```

**Tham số**:

- FormData với `file`: File cần upload
- FormData với `path` (optional): Thư mục đích trên R2
- FormData với `fileName` (optional): Tên file trên R2

**Headers**:

- Authorization: Bearer {token}

**Response**:

```json
{
  "success": true,
  "message": "Upload thành công",
  "url": "https://example.com/path/to/file",
  "key": "path/to/file"
}
```

### Tạo Job Chuyển Đổi HLS

```
POST /api/convert-hls
```

**Body**:

```json
{
  "videoKey": "episodes/123/456/original.mp4",
  "movieId": "123",
  "episodeId": "456"
}
```

**Headers**:

- Authorization: Bearer {token}

**Response**:

```json
{
  "success": true,
  "message": "Job chuyển đổi HLS đã được tạo",
  "jobId": "hls-job-1633456789-123",
  "hlsPath": "episodes/123/456/hls/master.m3u8",
  "status": "pending"
}
```

### Kiểm Tra Trạng Thái Job HLS

```
GET /api/hls-status/{jobId}
```

**Response**:

```json
{
  "success": true,
  "jobId": "hls-job-1633456789-123",
  "status": "completed",
  "videoKey": "episodes/123/456/original.mp4",
  "movieId": "123",
  "episodeId": "456",
  "hlsPath": "episodes/123/456/hls/master.m3u8",
  "createdAt": "2023-10-05T15:39:49.000Z",
  "updatedAt": "2023-10-05T15:45:12.000Z"
}
```

### Phục Vụ Nội Dung HLS

```
GET /hls/{path}
```

Endpoint này phục vụ các file `.m3u8`, `.ts`, `.m4s`, `.mp4`, v.v. từ R2 Storage với các headers phù hợp.

### Điều Chỉnh Kích Thước Hình Ảnh

```
GET /resize/{width}/{height}/{path}
```

Ví dụ: `/resize/300/auto/movies/123/poster.jpg`

### Xem Danh Sách Files Trong R2

```
GET /list-r2/{prefix}
```

**Headers**:

- Authorization: Bearer {token} (cho một số route)

## Quá Trình HLS

1. Upload video gốc lên R2 qua `/api/upload`
2. Tạo job chuyển đổi HLS qua `/api/convert-hls`
3. Kiểm tra trạng thái job qua `/api/hls-status/{jobId}`
4. Khi hoàn thành, phát video sử dụng đường dẫn `/hls/episodes/{movieId}/{episodeId}/hls/master.m3u8`

## Triển Khai

```bash
wrangler deploy
```

## Cấu Hình Môi Trường

Cấu hình nằm trong file `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "movie-web-vn"
preview_bucket_name = "movie-web-vn-dev"
```
