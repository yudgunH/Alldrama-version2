# Thiết Kế UI Trang Quản Lý Phim và Tập Phim

## 1. Tổng Quan

Tài liệu này mô tả thiết kế UI cho trang quản lý phim và tập phim, là một phần của hệ thống web đã được cấu hình sẵn. Trang này cho phép người dùng quản trị thực hiện các chức năng:

- Xem danh sách phim
- Thêm, sửa, xóa phim
- Quản lý tập phim cho từng phim
- Upload và theo dõi xử lý media

## 2. Trang Quản Lý Phim

### 2.1. Layout Tổng Thể

```
+--------------------------------------------------+
| Header (theo thiết kế hiện có của web)           |
+--------------------------------------------------+
| Breadcrumb: Trang chủ > Quản lý phim             |
+--------------------------------------------------+
| Tiêu đề: Quản Lý Phim                   + Thêm   |
+--------------------------------------------------+
| Thanh tìm kiếm và bộ lọc                         |
| [Tìm kiếm...]  [Thể loại ▼]  [Năm ▼]  [Lọc ▼]   |
+--------------------------------------------------+
| Bảng danh sách phim                               |
|                                                  |
| [Bảng dữ liệu phim với phân trang]               |
| (Bao gồm cột Rating và Views)                    |
|                                                  |
+--------------------------------------------------+
| Phân trang: << 1 2 3 ... 10 >>                   |
+--------------------------------------------------+
| Footer (theo thiết kế hiện có của web)           |
+--------------------------------------------------+
```

### 2.2. Bảng Danh Sách Phim

**Cấu trúc bảng**:

| Poster | Tên Phim   | Năm  | Thời Lượng | Thể Loại      | Số Tập | Rating | Views | Trạng Thái | Hành Động              |
| ------ | ---------- | ---- | ---------- | ------------- | ------ | ------ | ----- | ---------- | ---------------------- |
| [Ảnh]  | Tên phim 1 | 2024 | 120 phút   | Hành động     | 0      | 4.5 ★  | 1.2K  | Hoạt động  | [Chi tiết] [Sửa] [Xóa] |
| [Ảnh]  | Tên phim 2 | 2023 | 90 phút    | Hài, Tình cảm | 12     | 4.8 ★  | 5.7K  | Hoạt động  | [Chi tiết] [Sửa] [Xóa] |

**Mô tả các cột**:

- **Poster**: Thumbnail của poster phim (kích thước 60x90px)
- **Tên Phim**: Tên đầy đủ của phim, click vào đây sẽ dẫn đến trang chi tiết phim
- **Năm**: Năm phát hành
- **Thời Lượng**: Thời lượng phim (đơn vị phút)
- **Thể Loại**: Danh sách các thể loại, hiển thị tối đa 2 thể loại đầu tiên, còn lại hiển thị dưới dạng "+X"
- **Số Tập**: Số lượng tập phim đã thêm
- **Trạng Thái**: Trạng thái hiển thị của phim (Hoạt động/Tạm ẩn)
- **Hành Động**:
  - Nút Chi tiết: Dẫn đến trang chi tiết phim
  - Nút Sửa: Mở modal chỉnh sửa phim
  - Nút Xóa: Mở dialog xác nhận xóa phim

### 2.3. Tìm Kiếm và Bộ Lọc

**Thành phần**:

- **Thanh tìm kiếm**: Tìm theo tên phim
- **Dropdown Thể loại**: Filter theo một hoặc nhiều thể loại
- **Dropdown Năm**: Filter theo năm phát hành
- **Dropdown Lọc nâng cao**: Bao gồm các tùy chọn lọc theo:
  - Trạng thái (Tất cả/Hoạt động/Tạm ẩn)
  - Số tập (Có tập/Chưa có tập)
  - Thời lượng (Dưới 90p/90-120p/Trên 120p)
  - Rating (5 sao/4+ sao/3+ sao/Dưới 3 sao)
  - Views (>10K/>5K/>1K/<1K)

### 2.4. Form Thêm/Chỉnh Sửa Phim

Form hiển thị dưới dạng modal overlay trên trang danh sách:

```
+--------------------------------------------------+
| Thêm Phim Mới                                [X] |
+--------------------------------------------------+
| Thông tin cơ bản                                 |
+--------------------------------------------------+
| Tên phim*:                                       |
| [                                            ]   |
|                                                  |
| Mô tả:                                           |
| [                                            ]   |
| [                                            ]   |
|                                                  |
| Năm phát hành*:    Thời lượng* (giây):          |
| [        ]         [                ]            |
|                                                  |
| Thể loại*:                                       |
| [Dropdown multi-select                      ▼]   |
|                                                  |
| Rating (1-5):       Views:                       |
| [   4.5    ]        [    1200     ]              |
|                                                  |
+--------------------------------------------------+
| Media                                            |
+--------------------------------------------------+
|                      |                           |
| Upload Poster*:      | Upload Backdrop*:         |
| [Kéo thả file]       | [Kéo thả file]            |
| hoặc [Chọn file]     | hoặc [Chọn file]          |
|                      |                           |
| Kích thước: 300x450px| Kích thước: 1280x720px    |
| Tối đa: 10MB         | Tối đa: 10MB              |
|                      |                           |
+--------------------------------------------------+
| Upload Trailer (tùy chọn):                       |
| [Kéo thả file video] hoặc [Chọn file]            |
| Format: mp4, webm - Tối đa: 100MB                |
+--------------------------------------------------+
| [    Hủy    ]                   [    Lưu    ]    |
+--------------------------------------------------+
```

**Xử lý upload**:

- Khi người dùng chọn file media, sẽ gọi API presigned URL
- Hiển thị thanh tiến trình upload
- Sau khi upload xong, hiển thị preview
- Nếu upload thất bại, hiển thị thông báo lỗi và cho phép thử lại

## 3. Trang Chi Tiết Phim và Quản Lý Tập

### 3.1. Layout Tổng Thể

```
+--------------------------------------------------+
| Header (theo thiết kế hiện có của web)           |
+--------------------------------------------------+
| Breadcrumb: Trang chủ > Quản lý phim > Tên phim  |
+--------------------------------------------------+
| [Backdrop phim - kích thước lớn]                 |
+--------------------------------------------------+
| [Poster] | Tên phim (2024)                       |
|          | Thời lượng: 120 phút                  |
|          | Thể loại: Hành động, Phiêu lưu        |
|          | [Nút Chỉnh sửa] [Nút Xem trailer]     |
+--------------------------------------------------+
| [Tab: Thông tin] [Tab: Tập phim] [Tab: Thống kê] |
+--------------------------------------------------+
| Nội dung tab được chọn                           |
|                                                  |
+--------------------------------------------------+
| Footer (theo thiết kế hiện có của web)           |
+--------------------------------------------------+
```

### 3.2. Tab Thông Tin Phim

```
+--------------------------------------------------+
| Mô tả                                            |
+--------------------------------------------------+
| [Nội dung mô tả phim]                            |
|                                                  |
+--------------------------------------------------+
| Thông tin chi tiết                               |
+--------------------------------------------------+
| ID phim:         | MovieID123                    |
| Ngày tạo:        | 01/04/2025                    |
| Lần cập nhật cuối:| 02/05/2025                   |
| URL Poster:      | https://cdn.../poster.jpg     |
| URL Backdrop:    | https://cdn.../backdrop.jpg   |
| URL Trailer:     | https://cdn.../trailer.mp4    |
+--------------------------------------------------+
```

### 3.3. Tab Tập Phim

```
+--------------------------------------------------+
| Danh sách tập phim                    + Thêm tập |
+--------------------------------------------------+
| [Tìm kiếm...]  [Trạng thái ▼]                   |
+--------------------------------------------------+
| Bảng danh sách tập phim                          |
|                                                  |
| [Bảng dữ liệu tập phim với phân trang]           |
|                                                  |
+--------------------------------------------------+
| Phân trang: << 1 2 3 ... 5 >>                    |
+--------------------------------------------------+
```

**Cấu trúc bảng tập phim**:

| Thumbnail | Tập | Tên Tập        | Thời Lượng | Rating | Views | Trạng Thái         | HLS   | Hành Động        |
| --------- | --- | -------------- | ---------- | ------ | ----- | ------------------ | ----- | ---------------- |
| [Ảnh]     | 1   | Tập 1: Tên tập | 45:30      | 4.7 ★  | 1.5K  | ✓ Hoàn thành       | [Xem] | [Sửa] [Xóa]      |
| [Ảnh]     | 2   | Tập 2: Tên tập | --         | --     | --    | ⟳ Đang xử lý (45%) | --    | [Theo dõi] [Hủy] |

**Mô tả các cột**:

- **Thumbnail**: Hình thumbnail của tập phim
- **Tập**: Số thứ tự tập
- **Tên Tập**: Tên đầy đủ của tập
- **Thời Lượng**: Thời lượng của tập phim (phút:giây)
- **Rating**: Đánh giá trung bình của tập phim (1-5 sao)
- **Views**: Số lượt xem của tập phim
- **Trạng Thái**: Trạng thái xử lý của tập phim (Hoàn thành/Đang xử lý/Lỗi)
- **HLS**: Nút xem preview HLS stream (chỉ hiển thị khi đã xử lý xong)
- **Hành Động**:
  - Khi hoàn thành: [Sửa] [Xóa]
  - Khi đang xử lý: [Theo dõi] [Hủy]
  - Khi lỗi: [Thử lại] [Xóa]

### 3.4. Form Thêm/Chỉnh Sửa Tập Phim

```
+--------------------------------------------------+
| Thêm Tập Phim Mới                           [X] |
+--------------------------------------------------+
| Thông tin tập                                    |
+--------------------------------------------------+
| Số tập*:                                         |
| [        ]                                       |
|                                                  |
| Tên tập*:                                        |
| [                                            ]   |
|                                                  |
| Mô tả:                                           |
| [                                            ]   |
| [                                            ]   |
|                                                  |
| Rating (1-5):       Views:                       |
| [   4.7    ]        [    1500     ]              |
|                                                  |
+--------------------------------------------------+
| Upload Video                                     |
+--------------------------------------------------+
| [Kéo thả file video] hoặc [Chọn file]            |
|                                                  |
| Format: mp4, webm                                |
| Tối đa: 2GB                                      |
|                                                  |
+--------------------------------------------------+
| [    Hủy    ]                   [    Lưu    ]    |
+--------------------------------------------------+
```

**Quy trình thêm tập phim**:

1. Người dùng điền thông tin tập phim
2. Nhấn Lưu để gọi API tạo tập phim (`POST /api/episodes`)
3. Sau khi tạo thành công:
   - Hiển thị khu vực upload video
   - Khi người dùng chọn file, gọi API lấy presigned URL
   - Upload video lên R2 Storage
   - Chuyển đến màn hình theo dõi xử lý

### 3.5. Màn Hình Theo Dõi Xử Lý HLS

```
+--------------------------------------------------+
| Theo Dõi Xử Lý Tập: Tập 1 - Tên tập         [X] |
+--------------------------------------------------+
| Trạng thái: Đang xử lý (45%)                    |
| [====================-----------------------]    |
|                                                  |
| Thời gian ước tính còn lại: 5 phút              |
+--------------------------------------------------+
| Chi tiết xử lý:                                  |
+--------------------------------------------------+
| ✓ Upload video gốc hoàn thành (02/05 15:05:23)  |
| ✓ Tạo thumbnail hoàn thành (02/05 15:06:12)     |
| ✓ Chuyển đổi 240p hoàn thành (02/05 15:08:36)   |
| ✓ Chuyển đổi 360p hoàn thành (02/05 15:11:42)   |
| ⟳ Chuyển đổi 480p (82%)                         |
| ◯ Chuyển đổi 720p                               |
| ◯ Chuyển đổi 1080p                              |
| ◯ Tạo playlist HLS                              |
+--------------------------------------------------+
| [Xem thumbnail]                                  |
|                                                  |
| [Quay lại danh sách]         [Tự động làm mới]  |
+--------------------------------------------------+
```

**Chức năng**:

- Tự động cập nhật trạng thái mỗi 5 giây
- Hiển thị lịch sử xử lý chi tiết
- Cho phép quay lại danh sách tập phim
- Khi hoàn thành, hiển thị nút "Xem HLS stream"

## 4. Các Thành Phần UI Chung

### 4.1. Card Thông Báo Lỗi

```
+--------------------------------------------------+
| ⚠️ Lỗi Upload                                [X] |
+--------------------------------------------------+
| Không thể upload file. Lỗi: {chi tiết lỗi}       |
|                                                  |
| [Thử lại]                    [Hủy]               |
+--------------------------------------------------+
```

### 4.2. Media Uploader

```
+--------------------------------------------------+
| Upload {Loại Media}                              |
+--------------------------------------------------+
| [Kéo thả file vào đây]                           |
|                                                  |
|              hoặc                                |
|                                                  |
|            [Chọn file]                           |
|                                                  |
| Định dạng: {định dạng cho phép}                  |
| Kích thước tối đa: {kích thước tối đa}           |
+--------------------------------------------------+
```

**Trạng thái upload**:

```
+--------------------------------------------------+
| Đang upload... (45%)                             |
| [====================-----------------------]    |
|                                                  |
| file.mp4 - 45.3 MB / 100.2 MB                    |
|                                                  |
| [Hủy upload]                                     |
+--------------------------------------------------+
```

**Preview sau khi upload xong**:

```
+--------------------------------------------------+
| Upload hoàn thành                           [X]  |
+--------------------------------------------------+
| [Preview media]                                  |
|                                                  |
| Tên file: file.mp4                               |
| Kích thước: 100.2 MB                             |
| Loại: video/mp4                                  |
|                                                  |
| [Thay đổi]                                       |
+--------------------------------------------------+
```

### 4.3. Dialog Xác Nhận Xóa

```
+--------------------------------------------------+
| Xác nhận xóa                                     |
+--------------------------------------------------+
| Bạn có chắc chắn muốn xóa {tên mục}?             |
|                                                  |
| Hành động này không thể hoàn tác.                |
|                                                  |
| [    Hủy    ]                   [    Xóa    ]    |
+--------------------------------------------------+
```

## 5. Hướng Dẫn Style

### 5.1. Bảng Màu

- **Primary**: #2563EB - Màu chủ đạo, nút chính, links
- **Secondary**: #6B7280 - Nút thứ cấp, text thứ cấp
- **Success**: #10B981 - Trạng thái thành công, hoàn thành
- **Warning**: #F59E0B - Trạng thái cảnh báo, đang xử lý
- **Danger**: #EF4444 - Lỗi, xóa, trạng thái lỗi
- **Light**: #F9FAFB - Nền, header của bảng, card
- **Dark**: #111827 - Text chính, header

### 5.2. Components

Sử dụng các components có sẵn trong hệ thống web, bao gồm:

- Buttons (Primary, Secondary, Danger)
- Cards
- Tables
- Form elements (Input, Select, Textarea)
- Modals và Dialogs
- Progress bars
- Alerts và Notifications

## 6. Responsive Behavior

Trang quản lý phim và tập phim sẽ điều chỉnh layout dựa trên kích thước màn hình:

### 6.1. Desktop (>1200px)

- Hiển thị đầy đủ các cột trong bảng
- Layout 2 cột cho form thêm/sửa phim
- Preview media kích thước lớn

### 6.2. Tablet (768px-1199px)

- Thu gọn một số cột ít quan trọng trong bảng
- Layout 1 cột cho form
- Preview media kích thước vừa

### 6.3. Mobile (<767px)

- Chuyển đổi bảng sang dạng card list
- Form full width
- Preview media nhỏ hơn

## 7. Luồng Xử Lý Chính

### 7.1. Thêm Phim Mới

1. Click nút "Thêm" trên trang danh sách phim
2. Điền thông tin phim trong modal
3. Upload poster và backdrop
4. Nhấn Lưu để tạo phim mới
5. Chuyển đến trang chi tiết phim mới tạo

### 7.2. Thêm Tập Phim

1. Vào tab "Tập phim" trong trang chi tiết phim
2. Click nút "Thêm tập"
3. Điền thông tin tập phim
4. Nhấn Lưu để tạo tập phim mới
5. Upload video cho tập phim
6. Theo dõi tiến trình xử lý HLS

### 7.3. Chỉnh Sửa Phim

1. Click nút "Sửa" trên danh sách phim hoặc trang chi tiết
2. Chỉnh sửa thông tin trong modal
3. Upload media mới nếu cần
4. Nhấn Lưu để cập nhật thông tin phim

## 8. Xử Lý Lỗi

### 8.1. Validation Errors

- Hiển thị lỗi validation ngay dưới mỗi trường nhập liệu
- Đánh dấu trường lỗi bằng viền đỏ
- Tập trung vào trường lỗi đầu tiên khi submit form

### 8.2. API Errors

- Hiển thị thông báo lỗi dạng toast ở góc màn hình
- Cho phép retry các thao tác bị lỗi
- Log lỗi chi tiết ở console

### 8.3. Upload Errors

- Hiển thị thông báo lỗi trong khu vực upload
- Cung cấp nút "Thử lại" để upload lại
- Hiển thị chi tiết lỗi (định dạng không hỗ trợ, vượt quá kích thước, v.v.)

## 9. API Integration

Trang quản lý phim và tập phim sẽ tích hợp với các API đã cung cấp:

- `POST /api/media/presigned-url` - Lấy URL để upload media
- `POST /api/movies` - Tạo phim mới
- `PUT /api/movies/{id}` - Cập nhật thông tin phim
- `DELETE /api/movies/{id}` - Xóa phim
- `POST /api/episodes` - Tạo tập phim mới
- `PUT /api/episodes/{id}` - Cập nhật thông tin tập phim
- `DELETE /api/episodes/{id}` - Xóa tập phim
- `GET /api/media/episodes/{episodeId}/processing-status` - Kiểm tra trạng thái xử lý HLS
