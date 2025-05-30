# API Xóa Cải Thiện - Tích Hợp R2 Storage

Tài liệu này mô tả các API xóa đã được cải thiện để đảm bảo xóa sạch sẽ tất cả các object trên Cloudflare R2 Storage.

## 🎯 Tính Năng Chính

### 1. Xóa Phim Hoàn Toàn

- ✅ Xóa tất cả file media của phim (poster, backdrop, trailer)
- ✅ Xóa tất cả tập phim và file HLS liên quan
- ✅ Xóa record database sau khi xóa file R2
- ✅ Xử lý lỗi và rollback an toàn

### 2. Xóa Tập Phim Hoàn Toàn

- ✅ Xóa video gốc, thumbnail, file HLS
- ✅ Xóa tất cả segments và metadata
- ✅ Cập nhật tổng số tập của phim
- ✅ Xử lý lỗi và logging chi tiết

### 3. Quản Lý R2 Storage (Admin)

- ✅ Liệt kê file theo prefix để debug
- ✅ Xóa file theo prefix (bulk delete)
- ✅ Xóa file đơn lẻ
- ✅ Phân trang cho danh sách lớn

## 📚 API Endpoints

### Phim (Movies)

#### 1. Xóa Phim Hoàn Toàn

```http
DELETE /api/movies/:id
Authorization: Bearer {token}
```

**Mô tả**: Xóa phim và TẤT CẢ file liên quan trên R2

**Flow hoạt động**:

1. Tìm phim và tất cả tập phim liên quan
2. Xóa tất cả file R2 theo prefix `movies/{id}/` và `episodes/{id}/`
3. Xóa record database (episodes sẽ cascade delete)
4. Trả về kết quả

**Response**:

```json
{
  "message": "Xóa phim thành công"
}
```

#### 2. Xóa Media Cụ Thể

```http
DELETE /api/movies/:id/media/:mediaType
Authorization: Bearer {token}
```

**Params**:

- `mediaType`: `poster` | `backdrop` | `trailer`

**Response**:

```json
{
  "message": "Đã xóa poster thành công",
  "movieId": 123,
  "mediaType": "poster"
}
```

#### 3. Xóa Tất Cả File R2 (Giữ Database)

```http
DELETE /api/movies/:id/files
Authorization: Bearer {token}
```

**Mô tả**: Chỉ xóa file trên R2, giữ lại record trong database

### Tập Phim (Episodes)

#### 1. Xóa Tập Phim Hoàn Toàn

```http
DELETE /api/episodes/:id
Authorization: Bearer {token}
```

**Flow hoạt động**:

1. Tìm tập phim và thông tin phim
2. Xóa tất cả file R2 theo prefix `episodes/{movieId}/{episodeId}/`
3. Xóa record database
4. Cập nhật tổng số tập của phim

#### 2. Xóa Tất Cả File R2 (Giữ Database)

```http
DELETE /api/episodes/:id/files
Authorization: Bearer {token}
```

**Response**:

```json
{
  "message": "Đã xóa tất cả file của tập phim thành công",
  "episodeId": 456,
  "movieId": 123
}
```

### Quản Lý R2 (Admin Only)

#### 1. Liệt Kê File Theo Prefix

```http
GET /api/media/admin/r2/list/:prefix
Authorization: Bearer {adminToken}
```

**Ví dụ**:

```http
GET /api/media/admin/r2/list/movies/123
GET /api/media/admin/r2/list/episodes/123/456
```

**Response**:

```json
{
  "success": true,
  "prefix": "movies/123",
  "totalFiles": 3,
  "files": [
    {
      "key": "movies/123/poster.jpg",
      "url": "https://cdn.example.com/movies/123/poster.jpg"
    },
    {
      "key": "movies/123/backdrop.jpg",
      "url": "https://cdn.example.com/movies/123/backdrop.jpg"
    }
  ]
}
```

#### 2. Xóa File Theo Prefix (NGUY HIỂM)

```http
DELETE /api/media/admin/r2/prefix/:prefix
Authorization: Bearer {adminToken}
```

**Cảnh báo**: API này rất nguy hiểm, có thể xóa hàng nghìn file!

**Bảo vệ**: Prefix phải có ít nhất 3 ký tự

**Response**:

```json
{
  "success": true,
  "message": "Đã xóa thành công 157 files",
  "prefix": "episodes/123",
  "totalDeleted": 157
}
```

#### 3. Xóa File Đơn Lẻ

```http
DELETE /api/media/admin/r2/file/:key
Authorization: Bearer {adminToken}
```

**Ví dụ**:

```http
DELETE /api/media/admin/r2/file/movies/123/poster.jpg
```

## 🔧 Cải Thiện Kỹ Thuật

### 1. R2 Service Mới

- `deleteAllMovieFiles()`: Xóa tất cả file của phim
- `deleteAllEpisodeFiles()`: Xóa tất cả file của tập phim
- `deleteMovieMedia()`: Xóa media cụ thể
- `deleteFilesByPrefix()`: Xóa hàng loạt với phân trang
- `listFilesV2()`: Liệt kê với phân trang

### 2. Xử Lý Lỗi Cải Thiện

- Logging chi tiết cho mọi bước
- Rollback an toàn khi có lỗi
- Thông báo lỗi rõ ràng cho người dùng

### 3. Hiệu Suất

- Xóa song song (Promise.all)
- Phân trang cho danh sách lớn
- Timeout và retry logic

## 🚨 Lưu Ý Quan Trọng

### Bảo Mật

- Tất cả API xóa yêu cầu authentication
- API admin yêu cầu quyền admin
- Validate input cẩn thận

### Backup

- **LUÔN LUÔN** backup trước khi xóa hàng loạt
- Test trên môi trường dev trước
- Có kế hoạch recovery

### Monitoring

- Log tất cả hoạt động xóa
- Alert khi xóa số lượng lớn
- Theo dõi dung lượng R2

## 📝 Flow Troubleshooting

### Nếu Không Xóa Được File R2

1. **Kiểm tra quyền R2**:

```bash
# Kiểm tra biến môi trường
echo $R2_ACCESS_KEY_ID
echo $R2_SECRET_ACCESS_KEY
echo $R2_BUCKET
```

2. **Debug với API list**:

```http
GET /api/media/admin/r2/list/movies/123
```

3. **Xóa thủ công từng file**:

```http
DELETE /api/media/admin/r2/file/movies/123/poster.jpg
```

4. **Xóa theo prefix**:

```http
DELETE /api/media/admin/r2/prefix/movies/123
```

### Nếu Database Và R2 Không Đồng Bộ

1. **Tìm orphaned files**:

```http
GET /api/media/admin/r2/list/movies
GET /api/media/admin/r2/list/episodes
```

2. **So sánh với database**
3. **Cleanup orphaned files**

## 🧪 Testing

### Test Xóa Phim

```javascript
// Test trong frontend
const deleteMovie = async (movieId) => {
  const response = await fetch(`/api/movies/${movieId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    console.log("Phim đã được xóa hoàn toàn");
  }
};
```

### Test Xóa Tập Phim

```javascript
const deleteEpisode = async (episodeId) => {
  const response = await fetch(`/api/episodes/${episodeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
```

## 📊 Cấu Trúc File Trên R2

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
        /job-metadata.json
        /master.m3u8
        /240p.m3u8, 360p.m3u8, ...
        /init-240p.mp4, init-360p.mp4, ...
        /segment_240p_000.m4s, segment_240p_001.m4s, ...
        /segment_360p_000.m4s, segment_360p_001.m4s, ...
        ...
```

Khi xóa phim ID 123:

- Xóa tất cả trong `movies/123/`
- Xóa tất cả trong `episodes/123/`

Khi xóa tập phim ID 456 của phim 123:

- Xóa tất cả trong `episodes/123/456/`
