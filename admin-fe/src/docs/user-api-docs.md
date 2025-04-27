# API Chức Năng Người Dùng

## API Phim Yêu Thích (Favorites)

### Lấy danh sách phim yêu thích

```
GET /api/favorites
```

**Mô tả**: Lấy danh sách phim yêu thích của người dùng hiện tại

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "userId": 123,
    "movieId": 456,
    "favoritedAt": "2023-05-01T10:30:00.000Z",
    "movie": {
      "id": 456,
      "title": "Tên phim",
      "rating": 8.5,
      "posterUrl": "https://example.com/poster.jpg",
      "genres": [
        {
          "id": 1,
          "name": "Hành động"
        }
      ]
    }
  }
]
```

**Lỗi**:

- 401: Bạn cần đăng nhập để xem danh sách yêu thích
- 500: Lỗi máy chủ

### Thêm phim vào danh sách yêu thích

```
POST /api/favorites
```

**Mô tả**: Thêm một phim vào danh sách yêu thích của người dùng

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:

```json
{
  "movieId": 456
}
```

**Response (201 - Created)**:

```json
{
  "message": "Đã thêm phim vào danh sách yêu thích",
  "favorite": {
    "id": 1,
    "userId": 123,
    "movieId": 456,
    "favoritedAt": "2023-05-01T10:30:00.000Z",
    "movie": {
      "id": 456,
      "title": "Tên phim",
      "rating": 8.5,
      "posterUrl": "https://example.com/poster.jpg",
      "genres": [
        {
          "id": 1,
          "name": "Hành động"
        }
      ]
    }
  }
}
```

**Lỗi**:

- 400: Phim đã tồn tại trong danh sách yêu thích
- 401: Bạn cần đăng nhập để thực hiện chức năng này
- 404: Không tìm thấy phim
- 500: Lỗi máy chủ

### Xóa phim khỏi danh sách yêu thích

```
DELETE /api/favorites/:movieId
```

**Mô tả**: Xóa một phim khỏi danh sách yêu thích của người dùng

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `movieId`: ID của phim cần xóa khỏi danh sách yêu thích

**Response (200 - OK)**:

```json
{
  "message": "Đã xóa phim khỏi danh sách yêu thích"
}
```

**Lỗi**:

- 401: Bạn cần đăng nhập để thực hiện chức năng này
- 404: Không tìm thấy phim trong danh sách yêu thích
- 500: Lỗi máy chủ

## API Lịch Sử Xem (Watch History)

### Lấy lịch sử xem

```
GET /api/watch-history
```

**Mô tả**: Lấy lịch sử xem phim của người dùng hiện tại

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "userId": 123,
    "movieId": 456,
    "episodeId": 789,
    "watchedAt": "2023-05-01T15:30:00.000Z",
    "progress": 360,
    "duration": 1800,
    "isCompleted": false,
    "movie": {
      "id": 456,
      "title": "Tên phim",
      "posterUrl": "https://example.com/poster.jpg",
      "genres": [
        {
          "id": 1,
          "name": "Hành động"
        }
      ]
    },
    "episode": {
      "id": 789,
      "title": "Tập 1",
      "episodeNumber": 1
    }
  }
]
```

**Lỗi**:

- 401: Bạn cần đăng nhập để xem lịch sử xem
- 500: Lỗi máy chủ

### Thêm/Cập nhật lịch sử xem

```
POST /api/watch-history
```

**Mô tả**: Thêm hoặc cập nhật lịch sử xem phim của người dùng

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:

```json
{
  "movieId": 456,
  "episodeId": 789,
  "progress": 360,
  "duration": 1800
}
```

**Response (200 - OK)**:

```json
{
  "message": "Đã thêm/cập nhật lịch sử xem",
  "watchHistory": {
    "id": 1,
    "userId": 123,
    "movieId": 456,
    "episodeId": 789,
    "watchedAt": "2023-05-01T15:30:00.000Z",
    "progress": 360,
    "duration": 1800,
    "isCompleted": false,
    "movie": {
      "id": 456,
      "title": "Tên phim",
      "posterUrl": "https://example.com/poster.jpg"
    },
    "episode": {
      "id": 789,
      "title": "Tập 1"
    }
  },
  "viewIncreased": true
}
```

**Lỗi**:

- 401: Bạn cần đăng nhập để thực hiện chức năng này
- 404: Không tìm thấy phim hoặc tập phim
- 500: Lỗi máy chủ

### Xóa mục trong lịch sử xem

```
DELETE /api/watch-history/:id
```

**Mô tả**: Xóa một mục từ lịch sử xem của người dùng

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của mục lịch sử xem cần xóa

**Response (200 - OK)**:

```json
{
  "message": "Đã xóa khỏi lịch sử xem"
}
```

**Lỗi**:

- 401: Bạn cần đăng nhập để thực hiện chức năng này
- 404: Không tìm thấy mục trong lịch sử xem
- 500: Lỗi máy chủ

## API Bình Luận (Comments)

### Lấy danh sách bình luận của phim

```
GET /api/comments/movies/:movieId
```

**Mô tả**: Lấy danh sách bình luận cho một phim cụ thể

**Path Parameters**:

- `movieId`: ID của phim

**Query Parameters**:

- `page`: Trang hiện tại (mặc định: 1)
- `limit`: Số lượng bình luận mỗi trang (mặc định: 10)
- `sort`: Trường để sắp xếp (mặc định: 'createdAt')
- `order`: Thứ tự sắp xếp ('ASC' hoặc 'DESC', mặc định: 'DESC')

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "movieId": 456,
    "userId": 123,
    "userName": "nguyenvana",
    "comment": "Phim hay quá!",
    "createdAt": "2023-05-01T10:30:00.000Z",
    "updatedAt": "2023-05-01T10:30:00.000Z",
    "user": {
      "id": 123,
      "full_name": "Nguyễn Văn A"
    }
  }
]
```

**Lỗi**:

- 500: Lỗi máy chủ

### Lấy chi tiết bình luận

```
GET /api/comments/:id
```

**Mô tả**: Lấy thông tin chi tiết của một bình luận

**Path Parameters**:

- `id`: ID của bình luận

**Response (200 - OK)**:

```json
{
  "id": 1,
  "movieId": 456,
  "userId": 123,
  "userName": "nguyenvana",
  "comment": "Phim hay quá!",
  "createdAt": "2023-05-01T10:30:00.000Z",
  "updatedAt": "2023-05-01T10:30:00.000Z",
  "user": {
    "id": 123,
    "full_name": "Nguyễn Văn A"
  },
  "movie": {
    "id": 456,
    "title": "Tên phim"
  }
}
```

**Lỗi**:

- 404: Không tìm thấy bình luận
- 500: Lỗi máy chủ

### Tạo bình luận mới

```
POST /api/comments
```

**Mô tả**: Tạo bình luận mới cho một phim

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:

```json
{
  "movieId": 456,
  "comment": "Phim hay quá!"
}
```

**Response (201 - Created)**:

```json
{
  "message": "Tạo bình luận thành công",
  "comment": {
    "id": 1,
    "movieId": 456,
    "userId": 123,
    "userName": "nguyenvana",
    "comment": "Phim hay quá!",
    "createdAt": "2023-05-01T10:30:00.000Z",
    "updatedAt": "2023-05-01T10:30:00.000Z"
  }
}
```

**Lỗi**:

- 400: Thiếu thông tin bắt buộc
- 401: Bạn cần đăng nhập để bình luận
- 404: Không tìm thấy phim
- 500: Lỗi máy chủ

### Cập nhật bình luận

```
PUT /api/comments/:id
```

**Mô tả**: Cập nhật nội dung bình luận

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameters**:

- `id`: ID của bình luận cần cập nhật

**Request Body**:

```json
{
  "comment": "Phim hay và ý nghĩa!"
}
```

**Response (200 - OK)**:

```json
{
  "message": "Cập nhật bình luận thành công",
  "comment": {
    "id": 1,
    "movieId": 456,
    "userId": 123,
    "userName": "nguyenvana",
    "comment": "Phim hay và ý nghĩa!",
    "createdAt": "2023-05-01T10:30:00.000Z",
    "updatedAt": "2023-05-01T15:45:00.000Z"
  }
}
```

**Lỗi**:

- 400: Nội dung bình luận không được để trống
- 401: Bạn cần đăng nhập để cập nhật bình luận
- 403: Không có quyền sửa bình luận này
- 404: Không tìm thấy bình luận
- 500: Lỗi máy chủ

### Xóa bình luận

```
DELETE /api/comments/:id
```

**Mô tả**: Xóa bình luận

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của bình luận cần xóa

**Response (200 - OK)**:

```json
{
  "message": "Xóa bình luận thành công"
}
```

**Lỗi**:

- 401: Bạn cần đăng nhập để xóa bình luận
- 403: Không có quyền xóa bình luận này
- 404: Không tìm thấy bình luận
- 500: Lỗi máy chủ
