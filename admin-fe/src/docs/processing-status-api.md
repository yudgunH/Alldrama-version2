# API Trạng thái Xử lý Video

## Tổng quan

API này cung cấp các endpoint để kiểm tra trạng thái xử lý video của các tập phim. Khi một video được upload, nó sẽ trải qua quá trình xử lý để chuyển đổi sang định dạng HLS (HTTP Live Streaming) và tạo thumbnail.

## Các trạng thái xử lý

- `pending`: Video đang chờ xử lý
- `processing`: Video đang được xử lý
- `completed`: Video đã xử lý xong
- `failed`: Xử lý video thất bại
- `unknown`: Không xác định được trạng thái

## API Endpoints

### Kiểm tra trạng thái xử lý của một tập phim

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
    "thumbnailUrl": "episodes/123/456/thumbnail.jpg",
    "masterPlaylistUrl": "episodes/123/456/hls/master.m3u8",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Lỗi**:

- 401: Không được xác thực
- 404: Không tìm thấy tập phim
- 500: Lỗi máy chủ

### Kiểm tra trạng thái chi tiết

```
GET /api/media/episodes/:movieId/:episodeId/processing-status-detailed
```

**Mô tả**: Kiểm tra trạng thái chi tiết bao gồm tiến độ xử lý realtime

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
  "episodeId": 456,
  "movieId": 123,
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
    "thumbnailUrl": "episodes/123/456/thumbnail.jpg",
    "masterPlaylistUrl": "episodes/123/456/hls/master.m3u8",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Lỗi**:

- 401: Không được xác thực
- 404: Không tìm thấy tập phim
- 500: Lỗi máy chủ

### Kiểm tra trạng thái tất cả tập phim

```
GET /api/media/movies/:movieId/processing-status
```

**Mô tả**: Kiểm tra trạng thái xử lý của tất cả tập phim trong một phim

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
  "movieId": 123,
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
      "episodeId": 456,
      "episodeNumber": 1,
      "title": "Tập 1",
      "processingStatus": "completed",
      "playlistUrl": "https://cdn.example.com/episodes/123/456/hls/master.m3u8",
      "thumbnailUrl": "https://cdn.example.com/episodes/123/456/thumbnail.jpg"
    },
    {
      "episodeId": 457,
      "episodeNumber": 2,
      "title": "Tập 2",
      "processingStatus": "processing",
      "playlistUrl": null,
      "thumbnailUrl": null
    }
  ]
}
```

**Lỗi**:

- 401: Không được xác thực
- 404: Không tìm thấy phim
- 500: Lỗi máy chủ

## Các trường trong response

### Trường chung

- `episodeId`: ID của tập phim
- `processingStatus`: Trạng thái xử lý (`pending`, `processing`, `completed`, `failed`, `unknown`)
- `playlistUrl`: URL của file playlist HLS (null nếu chưa xử lý xong)
- `thumbnailUrl`: URL của thumbnail (null nếu chưa xử lý xong)
- `progress`: Tiến độ xử lý (0-100)
- `lastUpdated`: Thời gian cập nhật trạng thái gần nhất
- `estimatedTimeRemaining`: Thời gian ước tính còn lại (giây)

### Trường trong jobMetadata

- `status`: Trạng thái của job xử lý
- `progress`: Tiến độ xử lý (0-100)
- `error`: Thông báo lỗi (null nếu không có lỗi)
- `thumbnailUrl`: Đường dẫn tương đối đến thumbnail
- `masterPlaylistUrl`: Đường dẫn tương đối đến file playlist HLS
- `lastUpdated`: Thời gian cập nhật trạng thái gần nhất

### Trường trong summary

- `total`: Tổng số tập phim
- `completed`: Số tập đã xử lý xong
- `processing`: Số tập đang xử lý
- `pending`: Số tập đang chờ xử lý
- `failed`: Số tập xử lý thất bại
- `unknown`: Số tập không xác định được trạng thái

## Lưu ý

1. API này được sử dụng để theo dõi tiến độ xử lý video sau khi upload.

2. Frontend nên gọi API này định kỳ (ví dụ: mỗi 5 giây) để cập nhật trạng thái xử lý.

3. Khi `processingStatus` là `completed`, `playlistUrl` và `thumbnailUrl` sẽ chứa URL để truy cập video và thumbnail.

4. Nếu `processingStatus` là `failed`, `jobMetadata.error` sẽ chứa thông báo lỗi.

5. API kiểm tra trạng thái tất cả tập phim hữu ích để hiển thị tổng quan về tiến độ xử lý của một phim.
