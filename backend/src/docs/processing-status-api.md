# API Kiểm Tra Trạng Thái Xử Lý HLS Video

## Tổng quan

Hệ thống cung cấp 4 API chính để kiểm tra trạng thái xử lý HLS video:

1. **API cơ bản** - Kiểm tra trạng thái episode đơn lẻ
2. **API chi tiết** - Kiểm tra trạng thái với thông tin tiến độ realtime
3. **API tổng hợp** - Kiểm tra trạng thái tất cả episode trong một phim
4. **API Worker** - Kiểm tra trạng thái qua jobId

## 1. API Kiểm Tra Trạng Thái Cơ Bản

### Endpoint

```
GET /api/media/episodes/:episodeId/processing-status
```

### Mô tả

Lấy thông tin trạng thái xử lý cơ bản từ database.

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

```json
{
  "episodeId": 123,
  "isProcessed": false,
  "processingError": null,
  "playlistUrl": null,
  "thumbnailUrl": null,
  "processingStatus": "processing"
}
```

### Sử dụng

- Kiểm tra nhanh trạng thái episode
- Phù hợp cho việc hiển thị trạng thái trong danh sách

## 2. API Kiểm Tra Trạng Thái Chi Tiết

### Endpoint

```
GET /api/media/episodes/:movieId/:episodeId/processing-status-detailed
```

### Mô tả

Lấy thông tin trạng thái chi tiết bao gồm tiến độ xử lý realtime từ job-metadata.

### Headers

```
Authorization: Bearer {accessToken}
```

### Response (khi đang xử lý)

```json
{
  "success": true,
  "episodeId": 123,
  "movieId": 456,
  "isProcessed": false,
  "processingError": null,
  "processingStatus": "processing",
  "playlistUrl": null,
  "thumbnailUrl": null,
  "progress": 65,
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "estimatedTimeRemaining": 70,
  "jobMetadata": {
    "status": "PROCESSING",
    "progress": 65,
    "error": null,
    "thumbnailUrl": "episodes/456/123/thumbnail.jpg",
    "masterPlaylistUrl": "episodes/456/123/hls/master.m3u8",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### Response (khi hoàn thành)

```json
{
  "success": true,
  "episodeId": 123,
  "movieId": 456,
  "isProcessed": true,
  "processingError": null,
  "processingStatus": "completed",
  "playlistUrl": "https://worker-domain/episodes/456/123/hls/master.m3u8",
  "thumbnailUrl": "https://worker-domain/episodes/456/123/thumbnail.jpg"
}
```

### Sử dụng

- Hiển thị progress bar realtime
- Theo dõi chi tiết quá trình xử lý
- Ước tính thời gian còn lại

## 3. API Kiểm Tra Trạng Thái Phim

### Endpoint

```
GET /api/media/movies/:movieId/processing-status
```

### Mô tả

Lấy trạng thái xử lý của tất cả episode trong một phim.

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

```json
{
  "success": true,
  "movieId": 456,
  "summary": {
    "total": 24,
    "completed": 20,
    "processing": 2,
    "pending": 1,
    "failed": 1,
    "unknown": 0
  },
  "episodes": [
    {
      "episodeId": 123,
      "episodeNumber": 1,
      "title": "Tập 1",
      "isProcessed": true,
      "processingStatus": "completed",
      "processingError": null,
      "playlistUrl": "https://worker-domain/episodes/456/123/hls/master.m3u8",
      "thumbnailUrl": "https://worker-domain/episodes/456/123/thumbnail.jpg"
    },
    {
      "episodeId": 124,
      "episodeNumber": 2,
      "title": "Tập 2",
      "isProcessed": false,
      "processingStatus": "processing",
      "processingError": null,
      "playlistUrl": null,
      "thumbnailUrl": null
    }
  ]
}
```

### Sử dụng

- Dashboard quản lý phim
- Hiển thị tổng quan trạng thái tất cả episode
- Phân tích thống kê xử lý

## 4. API Worker (Cloudflare)

### Endpoint

```
GET https://worker-domain/api/hls-status/:jobId/:movieId/:episodeId
```

### Mô tả

Kiểm tra trạng thái qua jobId từ Cloudflare Worker.

### Response

```json
{
  "success": true,
  "jobId": "hls-job-1642234567890",
  "status": "PROCESSING",
  "videoKey": "episodes/456/123/original.mp4",
  "movieId": "456",
  "episodeId": "123",
  "hlsPath": "episodes/456/123/hls/master.m3u8",
  "hlsUrl": "https://worker-domain/hls/episodes/456/123/hls/master.m3u8",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Sử dụng

- Kiểm tra trạng thái ngay sau khi upload
- Không cần authentication
- Phù hợp cho frontend gọi trực tiếp

## Trạng Thái Xử Lý (Processing Status)

### Các trạng thái có thể:

- **`pending`**: Đang chờ xử lý
- **`processing`**: Đang xử lý HLS
- **`completed`**: Xử lý hoàn thành
- **`failed`**: Xử lý thất bại
- **`unknown`**: Không xác định

### Tiến độ xử lý (Progress):

- **0-10%**: Tạo thumbnail
- **10-80%**: Chuyển đổi video các độ phân giải
- **80-95%**: Upload file lên R2
- **95-100%**: Hoàn tất và cleanup

## Ví Dụ Sử Dụng

### 1. Kiểm tra trạng thái trong danh sách episode

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/media/episodes/123/processing-status"
```

### 2. Theo dõi tiến độ xử lý realtime

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/media/episodes/456/123/processing-status-detailed"
```

### 3. Kiểm tra tổng quan trạng thái phim

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/media/movies/456/processing-status"
```

### 4. Kiểm tra qua Worker (không cần auth)

```bash
curl "https://your-worker-domain/api/hls-status/hls-job-1642234567890/456/123"
```

## Lưu Ý

1. **API chi tiết** chỉ trả về thông tin tiến độ khi episode đang ở trạng thái `processing` hoặc `pending`
2. **Estimated time remaining** được tính dựa trên tiến độ hiện tại (không chính xác 100%)
3. **Job metadata** chỉ có sẵn trong quá trình xử lý, sẽ bị xóa sau khi hoàn thành
4. Nên sử dụng **API cơ bản** cho việc hiển thị danh sách và **API chi tiết** cho theo dõi tiến độ

## Error Handling

### Các lỗi thường gặp:

- **404**: Episode hoặc phim không tồn tại
- **401**: Chưa xác thực
- **500**: Lỗi server hoặc không thể kết nối R2

### Xử lý lỗi:

```javascript
try {
  const response = await fetch(
    "/api/media/episodes/123/456/processing-status-detailed"
  );
  const data = await response.json();

  if (!data.success) {
    console.error("Error:", data.error);
    return;
  }

  // Xử lý data.progress, data.jobMetadata...
} catch (error) {
  console.error("Network error:", error);
}
```
