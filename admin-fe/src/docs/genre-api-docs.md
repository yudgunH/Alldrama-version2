# API Thể Loại Phim

## Danh sách API Thể Loại

### Lấy danh sách thể loại

```
GET /api/genres
```

**Mô tả**: Lấy danh sách tất cả các thể loại phim

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "name": "Hành động"
  },
  {
    "id": 2,
    "name": "Phiêu lưu"
  },
  {
    "id": 3,
    "name": "Hoạt hình"
  }
]
```

**Lỗi**:

- 500: Lỗi khi lấy danh sách thể loại

### Lấy chi tiết thể loại

```
GET /api/genres/:id
```

**Mô tả**: Lấy thông tin chi tiết của một thể loại

**Path Parameters**:

- `id`: ID của thể loại

**Response (200 - OK)**:

```json
{
  "id": 1,
  "name": "Hành động"
}
```

**Lỗi**:

- 404: Không tìm thấy thể loại
- 500: Lỗi khi lấy thông tin thể loại

### Lấy danh sách phim theo thể loại

```
GET /api/genres/:id/movies
```

**Mô tả**: Lấy danh sách các phim thuộc một thể loại cụ thể

**Path Parameters**:

- `id`: ID của thể loại

**Response (200 - OK)**:

```json
{
  "genre": {
    "id": 1,
    "name": "Hành động"
  },
  "movies": [
    {
      "id": 1,
      "title": "Tên phim hành động 1",
      "rating": 8.5,
      "views": 1000,
      "summary": "Mô tả ngắn về phim",
      "posterUrl": "https://example.com/poster1.jpg",
      "releaseYear": 2023
    },
    {
      "id": 2,
      "title": "Tên phim hành động 2",
      "rating": 7.9,
      "views": 850,
      "summary": "Mô tả ngắn về phim",
      "posterUrl": "https://example.com/poster2.jpg",
      "releaseYear": 2022
    }
  ]
}
```

**Lỗi**:

- 404: Không tìm thấy thể loại
- 500: Lỗi khi lấy danh sách phim theo thể loại

### Tạo thể loại mới (chỉ Admin)

```
POST /api/genres
```

**Mô tả**: Tạo một thể loại phim mới

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "Khoa học viễn tưởng"
}
```

**Response (201 - Created)**:

```json
{
  "message": "Tạo thể loại thành công",
  "genre": {
    "id": 4,
    "name": "Khoa học viễn tưởng"
  }
}
```

**Lỗi**:

- 400: Thể loại này đã tồn tại
- 401: Không được xác thực
- 403: Không có quyền truy cập
- 500: Lỗi khi tạo thể loại mới

### Cập nhật thể loại (chỉ Admin)

```
PUT /api/genres/:id
```

**Mô tả**: Cập nhật thông tin của một thể loại

**Headers**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameters**:

- `id`: ID của thể loại cần cập nhật

**Request Body**:

```json
{
  "name": "Khoa học viễn tưởng & Fantasy"
}
```

**Response (200 - OK)**:

```json
{
  "message": "Cập nhật thể loại thành công",
  "genre": {
    "id": 4,
    "name": "Khoa học viễn tưởng & Fantasy"
  }
}
```

**Lỗi**:

- 400: Thể loại này đã tồn tại
- 401: Không được xác thực
- 403: Không có quyền truy cập
- 404: Không tìm thấy thể loại
- 500: Lỗi khi cập nhật thể loại

### Xóa thể loại (chỉ Admin)

```
DELETE /api/genres/:id
```

**Mô tả**: Xóa một thể loại phim

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Path Parameters**:

- `id`: ID của thể loại cần xóa

**Response (200 - OK)**:

```json
{
  "message": "Xóa thể loại thành công"
}
```

**Lỗi**:

- 400: Không thể xóa thể loại này vì đang được sử dụng bởi {số lượng} phim
- 401: Không được xác thực
- 403: Không có quyền truy cập
- 404: Không tìm thấy thể loại
- 500: Lỗi khi xóa thể loại
