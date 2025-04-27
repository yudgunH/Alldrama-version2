# API Phim

## Danh sách API Phim

### Lấy danh sách phim

```
GET /api/movies
```

**Mô tả**: Lấy danh sách phim với phân trang và sắp xếp

**Query Parameters**:

- `page`: Trang hiện tại (mặc định: 1)
- `limit`: Số lượng phim mỗi trang (mặc định: 10)
- `sort`: Trường để sắp xếp ('title', 'rating', 'views', 'releaseYear', 'createdAt')
- `order`: Thứ tự sắp xếp ('ASC' hoặc 'DESC', mặc định: 'DESC')

**Response (200 - OK)**:

```json
{
  "movies": [
    {
      "id": 1,
      "title": "Tên phim",
      "rating": 8.5,
      "views": 1000,
      "summary": "Mô tả ngắn về phim",
      "duration": 120,
      "totalEpisodes": 1,
      "releaseYear": 2023,
      "posterUrl": "https://example.com/poster.jpg",
      "trailerUrl": "https://youtube.com/watch?v=trailer",
      "playlistUrl": "https://example.com/playlist",
      "genres": [
        {
          "id": 1,
          "name": "Hành động"
        },
        {
          "id": 2,
          "name": "Phiêu lưu"
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```

**Lỗi**:

- 500: Lỗi máy chủ

### Tìm kiếm phim

```
GET /api/movies/search
```

**Mô tả**: Tìm kiếm phim theo từ khóa, thể loại, năm phát hành

**Query Parameters**:

- `q`: Từ khóa tìm kiếm (tìm trong tiêu đề và tóm tắt phim)
- `genre`: ID thể loại phim
- `year`: Năm phát hành
- `page`: Trang hiện tại (mặc định: 1)
- `limit`: Số lượng phim mỗi trang (mặc định: 10)
- `sort`: Trường để sắp xếp ('title', 'rating', 'views', 'releaseYear', 'createdAt')
- `order`: Thứ tự sắp xếp ('ASC' hoặc 'DESC', mặc định: 'DESC')

**Response (200 - OK)**:

```json
{
  "movies": [
    {
      "id": 1,
      "title": "Tên phim",
      "rating": 8.5,
      "views": 1000,
      "summary": "Mô tả ngắn về phim",
      "duration": 120,
      "totalEpisodes": 1,
      "releaseYear": 2023,
      "posterUrl": "https://example.com/poster.jpg",
      "trailerUrl": "https://youtube.com/watch?v=trailer",
      "playlistUrl": "https://example.com/playlist",
      "genres": [
        {
          "id": 1,
          "name": "Hành động"
        }
      ]
    }
  ],
  "pagination": {
    "total": 50,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 10
  }
}
```

**Lỗi**:

- 500: Lỗi máy chủ

### Lấy chi tiết phim theo ID

```
GET /api/movies/:id
```

**Mô tả**: Lấy thông tin chi tiết của một phim theo ID

**Path Parameters**:

- `id`: ID của phim

**Response (200 - OK)**:

```json
{
  "id": 1,
  "title": "Tên phim",
  "rating": 8.5,
  "views": 1000,
  "summary": "Mô tả chi tiết về phim...",
  "duration": 120,
  "totalEpisodes": 1,
  "releaseYear": 2023,
  "posterUrl": "https://example.com/poster.jpg",
  "trailerUrl": "https://youtube.com/watch?v=trailer",
  "playlistUrl": "https://example.com/playlist",
  "genres": [
    {
      "id": 1,
      "name": "Hành động"
    },
    {
      "id": 2,
      "name": "Phiêu lưu"
    }
  ]
}
```

**Lỗi**:

- 404: Không tìm thấy phim
- 500: Lỗi máy chủ

### Tạo phim mới (chỉ Admin)

```
POST /api/movies
```

**Mô tả**: Tạo phim mới (yêu cầu quyền Admin)

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Request Body**:

```json
{
  "title": "Tên phim mới",
  "summary": "Mô tả chi tiết về phim...",
  "duration": 120,
  "totalEpisodes": 1,
  "releaseYear": 2023,
  "posterUrl": "https://example.com/poster.jpg",
  "trailerUrl": "https://youtube.com/watch?v=trailer",
  "playlistUrl": "https://example.com/playlist",
  "genreIds": [1, 2]
}
```

**Response (201 - Created)**:

```json
{
  "id": 2,
  "title": "Tên phim mới",
  "rating": 0,
  "views": 0,
  "summary": "Mô tả chi tiết về phim...",
  "duration": 120,
  "totalEpisodes": 1,
  "releaseYear": 2023,
  "posterUrl": "https://example.com/poster.jpg",
  "trailerUrl": "https://youtube.com/watch?v=trailer",
  "playlistUrl": "https://example.com/playlist",
  "genres": [
    {
      "id": 1,
      "name": "Hành động"
    },
    {
      "id": 2,
      "name": "Phiêu lưu"
    }
  ]
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền truy cập
- 500: Lỗi máy chủ

### Cập nhật phim (chỉ Admin)

```
PUT /api/movies/:id
```

**Mô tả**: Cập nhật thông tin phim (yêu cầu quyền Admin)

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của phim cần cập nhật

**Request Body**:

```json
{
  "title": "Tên phim đã chỉnh sửa",
  "summary": "Mô tả chi tiết về phim đã cập nhật...",
  "duration": 130,
  "totalEpisodes": 1,
  "releaseYear": 2023,
  "posterUrl": "https://example.com/poster-updated.jpg",
  "trailerUrl": "https://youtube.com/watch?v=trailer-updated",
  "playlistUrl": "https://example.com/playlist-updated",
  "genreIds": [1, 3]
}
```

**Response (200 - OK)**:

```json
{
  "id": 1,
  "title": "Tên phim đã chỉnh sửa",
  "rating": 8.5,
  "views": 1000,
  "summary": "Mô tả chi tiết về phim đã cập nhật...",
  "duration": 130,
  "totalEpisodes": 1,
  "releaseYear": 2023,
  "posterUrl": "https://example.com/poster-updated.jpg",
  "trailerUrl": "https://youtube.com/watch?v=trailer-updated",
  "playlistUrl": "https://example.com/playlist-updated",
  "genres": [
    {
      "id": 1,
      "name": "Hành động"
    },
    {
      "id": 3,
      "name": "Khoa học viễn tưởng"
    }
  ]
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền truy cập
- 404: Không tìm thấy phim
- 500: Lỗi máy chủ

### Xóa phim (chỉ Admin)

```
DELETE /api/movies/:id
```

**Mô tả**: Xóa phim khỏi hệ thống (yêu cầu quyền Admin)

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của phim cần xóa

**Response (200 - OK)**:

```json
{
  "message": "Xóa phim thành công"
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền truy cập
- 404: Không tìm thấy phim
- 500: Lỗi máy chủ
