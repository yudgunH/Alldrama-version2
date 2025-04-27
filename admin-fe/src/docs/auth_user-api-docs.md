# API Authentication và User

## Authentication API

### Đăng ký (Register)

```
POST /api/auth/register
```

**Mô tả**: Đăng ký tài khoản mới

**Request Body**:

```json
{
  "full_name": "Nguyễn Văn A",
  "email": "example@gmail.com",
  "password": "password123"
}
```

**Response (201 - Created)**:

```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "email": "example@gmail.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lỗi**:

- 400: Email đã được sử dụng hoặc dữ liệu không hợp lệ
- 500: Lỗi máy chủ

### Đăng nhập (Login)

```
POST /api/auth/login
```

**Mô tả**: Đăng nhập vào hệ thống

**Request Body**:

```json
{
  "email": "example@gmail.com",
  "password": "password123"
}
```

**Response (200 - OK)**:

```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "email": "example@gmail.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lỗi**:

- 401: Email hoặc mật khẩu không chính xác
- 500: Lỗi máy chủ

### Làm mới token (Refresh Token)

```
POST /api/auth/refresh
```

**Mô tả**: Làm mới access token khi đã hết hạn

**Request**: Sử dụng cookie `refreshToken` (tự động gửi)

**Response (200 - OK)**:

```json
{
  "message": "Refresh token thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lỗi**:

- 401: Refresh token không hợp lệ hoặc đã hết hạn

### Lấy thông tin người dùng hiện tại

```
GET /api/auth/me
```

**Mô tả**: Lấy thông tin người dùng đang đăng nhập

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
{
  "id": 1,
  "full_name": "Nguyễn Văn A",
  "email": "example@gmail.com",
  "role": "user",
  "subscriptionExpiredAt": "2023-12-31T23:59:59.000Z"
}
```

**Lỗi**:

- 401: Không được xác thực hoặc token không hợp lệ
- 500: Lỗi máy chủ

### Đăng xuất (Logout)

```
POST /api/auth/logout
```

**Mô tả**: Đăng xuất khỏi hệ thống

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
{
  "message": "Đăng xuất thành công"
}
```

**Lỗi**:

- 401: Không được xác thực hoặc token không hợp lệ
- 500: Lỗi máy chủ

### Đăng xuất khỏi tất cả thiết bị

```
POST /api/auth/logout-all
```

**Mô tả**: Đăng xuất khỏi tất cả các thiết bị đã đăng nhập

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
{
  "message": "Đã đăng xuất khỏi tất cả các thiết bị"
}
```

**Lỗi**:

- 401: Không được xác thực hoặc token không hợp lệ
- 500: Lỗi máy chủ

### Xác thực qua email

```
POST /api/auth/email-auth
```

**Mô tả**: Đăng nhập hoặc đăng ký thông qua email (không cần mật khẩu)

**Request Body**:

```json
{
  "email": "example@gmail.com",
  "isSignUp": true
}
```

**Response (200 - OK)**:

```json
{
  "message": "Đăng ký thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "example",
    "email": "example@gmail.com",
    "role": "user"
  }
}
```

**Lỗi**:

- 400: Email đã được sử dụng (khi đăng ký)
- 404: Không tìm thấy tài khoản (khi đăng nhập)
- 500: Lỗi máy chủ

### Lấy CSRF Token

```
GET /api/auth/csrf-token
```

**Mô tả**: Lấy CSRF token để bảo vệ các request quan trọng

**Response (200 - OK)**:

```json
{
  "message": "CSRF token đã được đặt trong cookie"
}
```

## User API

### Lấy danh sách người dùng (chỉ Admin)

```
GET /api/users
```

**Mô tả**: Lấy danh sách tất cả người dùng (yêu cầu quyền Admin)

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "email": "example@gmail.com",
    "role": "user",
    "subscriptionExpiredAt": "2023-12-31T23:59:59.000Z",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "full_name": "Admin",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
]
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền truy cập
- 500: Lỗi máy chủ

### Lấy thông tin người dùng theo ID

```
GET /api/users/:id
```

**Mô tả**: Lấy thông tin chi tiết của người dùng theo ID

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
{
  "id": 1,
  "full_name": "Nguyễn Văn A",
  "email": "example@gmail.com",
  "role": "user",
  "subscriptionExpiredAt": "2023-12-31T23:59:59.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

**Lỗi**:

- 401: Không được xác thực
- 404: Không tìm thấy người dùng
- 500: Lỗi máy chủ

### Cập nhật thông tin người dùng

```
PUT /api/users/:id
```

**Mô tả**: Cập nhật thông tin người dùng. Người dùng chỉ có thể cập nhật thông tin của chính mình, Admin có thể cập nhật thông tin của bất kỳ ai.

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Request Body**:

```json
{
  "full_name": "Nguyễn Văn A Cập Nhật",
  "email": "new-email@example.com",
  "password": "new-password123"
}
```

**Admin có thể cập nhật thêm**:

```json
{
  "role": "subscriber",
  "subscriptionExpiredAt": "2024-12-31T23:59:59.000Z"
}
```

**Response (200 - OK)**:

```json
{
  "message": "Cập nhật thông tin người dùng thành công",
  "user": {
    "id": 1,
    "full_name": "Nguyễn Văn A Cập Nhật",
    "email": "new-email@example.com",
    "role": "user",
    "subscriptionExpiredAt": null,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền cập nhật
- 404: Không tìm thấy người dùng
- 500: Lỗi máy chủ

### Xóa người dùng (chỉ Admin)

```
DELETE /api/users/:id
```

**Mô tả**: Xóa người dùng khỏi hệ thống (yêu cầu quyền Admin)

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
{
  "message": "Xóa người dùng thành công"
}
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền xóa
- 404: Không tìm thấy người dùng
- 500: Lỗi máy chủ

### Lấy danh sách phim yêu thích của người dùng

```
GET /api/users/:id/favorites
```

**Mô tả**: Lấy danh sách phim yêu thích của người dùng. Người dùng chỉ có thể xem danh sách yêu thích của chính mình, Admin có thể xem của bất kỳ ai.

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "movieId": 123,
    "favoritedAt": "2023-05-20T15:30:00.000Z",
    "movie": {
      "id": 123,
      "title": "Tên phim",
      "poster": "url-to-poster.jpg",
      "releaseYear": 2023
    }
  }
]
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền xem
- 404: Không tìm thấy người dùng
- 500: Lỗi máy chủ

### Lấy lịch sử xem phim của người dùng

```
GET /api/users/:id/watch-history
```

**Mô tả**: Lấy lịch sử xem phim của người dùng. Người dùng chỉ có thể xem lịch sử của chính mình, Admin có thể xem của bất kỳ ai.

**Headers**:

```
Authorization: Bearer {accessToken}
```

**Response (200 - OK)**:

```json
[
  {
    "id": 1,
    "movieId": 123,
    "episodeId": 456,
    "watchedAt": "2023-05-20T15:30:00.000Z",
    "progress": 360,
    "duration": 3600,
    "isCompleted": false,
    "movie": {
      "id": 123,
      "title": "Tên phim",
      "poster": "url-to-poster.jpg"
    },
    "episode": {
      "id": 456,
      "title": "Tập 1",
      "episodeNumber": 1
    }
  }
]
```

**Lỗi**:

- 401: Không được xác thực
- 403: Không có quyền xem
- 404: Không tìm thấy người dùng
- 500: Lỗi máy chủ
