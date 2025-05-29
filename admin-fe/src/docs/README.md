# Tài Liệu API Alldrama

## Giới thiệu

Thư mục này chứa tài liệu API cho dự án Alldrama. Tài liệu giúp frontend developers hiểu cách tương tác với các API endpoint của backend.

## Cấu trúc tài liệu

1. **API Authentication & User**

   - [auth_user-api-docs.md](./auth_user-api-docs.md): API xác thực và quản lý người dùng

2. **API Media**

   - [media-api-docs.md](./media-api-docs.md): API quản lý media (upload, xử lý video)
   - [media_upload_road.md](./media_upload_road.md): Hướng dẫn quy trình upload media
   - [processing-status-api.md](./processing-status-api.md): API kiểm tra trạng thái xử lý video

3. **API Nội dung**

   - [movie-api-docs.md](./movie-api-docs.md): API quản lý phim
   - [episode-api-docs.md](./episode-api-docs.md): API quản lý tập phim
   - [genre-api-docs.md](./genre-api-docs.md): API quản lý thể loại

4. **API Thống kê**

   - [stats-api-docs.md](./stats-api-docs.md): API thống kê và báo cáo

5. **Hướng dẫn bảo mật**
   - [security_guide.md](./security_guide.md): Hướng dẫn bảo mật và best practices

## Cách sử dụng

1. **Swagger UI**

   - Truy cập `http://localhost:8000/api-docs` (development) hoặc `https://api.alldrama.tech/api-docs` (production)
   - Sử dụng giao diện Swagger UI để kiểm tra và thử nghiệm API

2. **Tài liệu chi tiết**
   - Mỗi file markdown chứa thông tin chi tiết về một nhóm API cụ thể
   - Bao gồm mô tả endpoint, tham số, request và response schemas
   - Có ví dụ request/response để dễ hiểu

## Lưu ý cho Frontend Developers

### Authentication

- Hầu hết các API yêu cầu JWT token
- Lưu token nhận được từ login/register và gửi trong header Authorization
- Chuỗi header: `Authorization: Bearer <token>`

### Xử lý lỗi

- Luôn kiểm tra status code khi gọi API
- Đối với lỗi, response sẽ có định dạng:

```json
{
  "message": "Thông báo lỗi"
}
```

### Pagination

- Nhiều API hỗ trợ phân trang với tham số `page` và `limit`
- Response sẽ bao gồm `totalPages`, `currentPage` và tổng số item

### Xử lý video

- Khi upload video, sử dụng API trong `media-api-docs.md`
- Theo dõi trạng thái xử lý qua API trong `processing-status-api.md`
- Tham khảo `media_upload_road.md` để hiểu quy trình upload

## Cập nhật tài liệu

- Tài liệu này được tạo dựa trên mã nguồn hiện tại
- Khi API thay đổi, vui lòng cập nhật tài liệu tương ứng
- Đảm bảo tính nhất quán giữa các file tài liệu

## Hỗ trợ

Nếu bạn có bất kỳ câu hỏi nào về API, vui lòng liên hệ:

- Email: support@alldrama.tech
- GitHub: Tạo issue trong repository dự án
