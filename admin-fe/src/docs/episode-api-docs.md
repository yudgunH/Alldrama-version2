# API Tập Phim

## Danh sách API Tập Phim

### Lấy danh sách tập phim của một phim

```
GET /api/episodes/movie/:movieId
```

**Mô tả**: Lấy danh sách tất cả các tập phim thuộc một phim cụ thể

**Path Parameters**:

- `movieId`: ID của phim cần lấy danh sách tập

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "movieId": 1,
    "episodeNumber": 1,
    "title": "Tập 1: Bắt đầu cuộc hành trình",
    "description": "Mô tả nội dung tập phim",
    "playlistUrl": "https://example.com/playlist.m3u8",
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "duration": 2400,
    "isProcessed": true,
    "views": 1200,
    "createdAt": "2023-05-01T10:30:00.000Z",
    "updatedAt": "2023-05-01T10:30:00.000Z"
  },
  {
    "id": 2,
    "movieId": 1,
    "episodeNumber": 2,
    "title": "Tập 2: Cuộc gặp gỡ định mệnh",
    "description": "Mô tả nội dung tập phim",
    "playlistUrl": "https://example.com/playlist2.m3u8",
    "thumbnailUrl": "https://example.com/thumbnail2.jpg",
    "duration": 2600,
    "isProcessed": true,
    "views": 980,
    "createdAt": "2023-05-08T10:30:00.000Z",
    "updatedAt": "2023-05-08T10:30:00.000Z"
  }
]
```

**Lỗi**:

- 404: Không tìm thấy phim
- 500: Lỗi khi lấy danh sách tập phim

### Lấy chi tiết tập phim

```
GET /api/episodes/:id
```

**Mô tả**: Lấy thông tin chi tiết của một tập phim cụ thể

**Path Parameters**:

- `id`: ID của tập phim

**Response (200 - OK)**:

```json
{
  "id": 1,
  "movieId": 1,
  "episodeNumber": 1,
  "title": "Tập 1: Bắt đầu cuộc hành trình",
  "description": "Mô tả nội dung tập phim",
  "playlistUrl": "https://example.com/playlist.m3u8",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "duration": 2400,
  "isProcessed": true,
  "processingError": null,
  "views": 1200,
  "createdAt": "2023-05-01T10:30:00.000Z",
  "updatedAt": "2023-05-01T10:30:00.000Z",
  "movie": {
    "id": 1,
    "title": "Tên phim",
    "releaseYear": 2023,
    "posterUrl": "https://example.com/poster.jpg"
  }
}
```

**Lỗi**:

- 404: Không tìm thấy tập phim
- 500: Lỗi khi lấy thông tin tập phim

### Tạo tập phim mới (chỉ Admin)

```
POST /api/episodes
```

**Mô tả**: Tạo một tập phim mới

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:

```json
{
  "movieId": 1,
  "episodeNumber": 3,
  "title": "Tập 3: Đối mặt với thử thách",
  "description": "Mô tả nội dung tập phim",
  "playlistUrl": "https://example.com/playlist3.m3u8",
  "thumbnailUrl": "https://example.com/thumbnail3.jpg",
  "duration": 2500
}
```

**Response (201 - Created)**:

```json
{
  "message": "Tạo tập phim thành công",
  "episode": {
    "id": 3,
    "movieId": 1,
    "episodeNumber": 3,
    "title": "Tập 3: Đối mặt với thử thách",
    "description": "Mô tả nội dung tập phim",
    "playlistUrl": "https://example.com/playlist3.m3u8",
    "thumbnailUrl": "https://example.com/thumbnail3.jpg",
    "duration": 2500,
    "isProcessed": false,
    "views": 0,
    "createdAt": "2023-05-15T10:30:00.000Z",
    "updatedAt": "2023-05-15T10:30:00.000Z"
  }
}
```

**Lỗi**:

- 400: Số tập này đã tồn tại
- 401: Không được xác thực
- 403: Không có quyền truy cập
- 404: Không tìm thấy phim
- 500: Lỗi khi tạo tập phim mới

### Cập nhật tập phim (chỉ Admin)

```
PUT /api/episodes/:id
```

**Mô tả**: Cập nhật thông tin của một tập phim

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameters**:

- `id`: ID của tập phim cần cập nhật

**Request Body**:

```json
{
  "episodeNumber": 3,
  "title": "Tập 3: Đối mặt với thử thách (phiên bản mới)",
  "description": "Mô tả nội dung tập phim đã được cập nhật",
  "playlistUrl": "https://example.com/playlist3-updated.m3u8",
  "thumbnailUrl": "https://example.com/thumbnail3-updated.jpg",
  "duration": 2550
}
```

**Response (200 - OK)**:

```json
{
  "message": "Cập nhật tập phim thành công",
  "episode": {
    "id": 3,
    "movieId": 1,
    "episodeNumber": 3,
    "title": "Tập 3: Đối mặt với thử thách (phiên bản mới)",
    "description": "Mô tả nội dung tập phim đã được cập nhật",
    "playlistUrl": "https://example.com/playlist3-updated.m3u8",
    "thumbnailUrl": "https://example.com/thumbnail3-updated.jpg",
    "duration": 2550,
    "isProcessed": false,
    "views": 0,
    "createdAt": "2023-05-15T10:30:00.000Z",
    "updatedAt": "2023-05-15T11:45:00.000Z"
  }
}
```

**Lỗi**:

- 400: Số tập này đã tồn tại
- 401: Không được xác thực
- 403: Không có quyền truy cập
- 404: Không tìm thấy tập phim
- 500: Lỗi khi cập nhật tập phim

### Xóa tập phim (chỉ Admin)

```
DELETE /api/episodes/:id
```

**Mô tả**: Xóa một tập phim

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của tập phim cần xóa

**Response (200 - OK)**:

```json
{
  "message": "Xóa tập phim thành công"
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền truy cập
- 404: Không tìm thấy tập phim
- 500: Lỗi khi xóa tập phim

## API Lượt Xem

### Tăng lượt xem cho phim

```
POST /api/views/movie/:movieId
```

**Mô tả**: Tăng số lượt xem cho một phim. API này có thể được gọi bởi cả người dùng đăng nhập và không đăng nhập. Nếu người dùng đã đăng nhập, lịch sử xem sẽ được lưu lại.

**Headers**:

```
Authorization: Bearer {accessToken} (tùy chọn)
Content-Type: application/json
```

**Path Parameters**:

- `movieId`: ID của phim cần tăng lượt xem

**Request Body**:

```json
{
  "progress": 1800,
  "duration": 5400
}
```

> **Chú thích**: `progress` là thời gian đã xem (tính bằng giây), `duration` là tổng thời lượng (tính bằng giây).

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Đã tăng lượt xem cho phim"
}
```

**Lỗi**:

- 500: Lỗi khi tăng lượt xem cho phim

### Tăng lượt xem cho tập phim

```
POST /api/views/episode/:episodeId
```

**Mô tả**: Tăng số lượt xem cho một tập phim. API này có thể được gọi bởi cả người dùng đăng nhập và không đăng nhập. Nếu người dùng đã đăng nhập, lịch sử xem sẽ được lưu lại.

**Headers**:

```
Authorization: Bearer {accessToken} (tùy chọn)
Content-Type: application/json
```

**Path Parameters**:

- `episodeId`: ID của tập phim cần tăng lượt xem

**Request Body**:

```json
{
  "movieId": 1,
  "progress": 1200,
  "duration": 2400
}
```

> **Chú thích**: `movieId` là ID của phim mà tập phim thuộc về (bắt buộc), `progress` là thời gian đã xem (tính bằng giây), `duration` là tổng thời lượng (tính bằng giây).

**Response (200 - OK)**:

```json
{
  "success": true,
  "message": "Đã tăng lượt xem cho tập phim"
}
```

**Lỗi**:

- 400: Thiếu movieId
- 500: Lỗi khi tăng lượt xem cho tập phim
