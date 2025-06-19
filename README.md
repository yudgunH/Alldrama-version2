# 🎬 AllDrama - Nền tảng Streaming Phim Trực Tuyến

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)

AllDrama là một nền tảng streaming phim trực tuyến hiện đại, được xây dựng với công nghệ tiên tiến nhất để cung cấp trải nghiệm xem phim mượt mà và chất lượng cao.

## 🌟 Tính năng chính

### 👥 Dành cho người dùng

- **🎥 Xem phim chất lượng cao** với công nghệ HLS streaming
- **🔍 Tìm kiếm thông minh** theo tên phim, thể loại, diễn viên
- **📱 Responsive design** tối ưu cho mọi thiết bị
- **💬 Hệ thống bình luận** và đánh giá phim
- **❤️ Danh sách yêu thích** cá nhân
- **📈 Lịch sử xem** và đề xuất phim
- **👤 Quản lý hồ sơ** cá nhân

### 🛠️ Dành cho quản trị viên

- **📊 Dashboard thống kê** chi tiết
- **🎬 Quản lý phim** và tập phim
- **👥 Quản lý người dùng**
- **🏷️ Quản lý thể loại**
- **💬 Kiểm duyệt bình luận**
- **📈 Báo cáo và phân tích**

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Admin Panel   │    │   Backend API   │
│   (Next.js 15)  │◄──►│   (Next.js 15)  │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Video Processing     │
                    │    (HLS Processor)      │
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Cloudflare Worker     │
                    │   (CDN & Optimization)  │
                    └─────────────────────────┘
```

## 🚀 Công nghệ sử dụng

### Frontend & Admin

- **Framework**: Next.js 15 với App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + Shadcn UI
- **State Management**: Zustand
- **HTTP Client**: Axios với SWR
- **Authentication**: JWT

### Backend

- **Runtime**: Node.js với TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL với Sequelize ORM
- **Cache**: Redis
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Video Processing**: FFmpeg
- **Documentation**: Swagger/OpenAPI

### DevOps & Infrastructure

- **Containerization**: Docker & Docker Compose
- **CDN**: Cloudflare Workers
- **Video Streaming**: HLS (HTTP Live Streaming)
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 20.0.0
- **npm/yarn**: >= 8.0.0
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0
- **Docker**: >= 20.0 (tùy chọn)
- **FFmpeg**: >= 4.0 (cho xử lý video)

## 🌐 Truy cập ứng dụng

- **Frontend**: https://www.alldrama.net/
- **Admin Panel**: https://alldrama-version2.vercel.app/login

## 📚 Tài liệu API

Tài liệu API chi tiết được lưu trong thư mục `docs/`:

- [User API](./backend/src/docs/user-api-docs.md)
- [Movie API](./backend/src/docs/movie-api-docs.md)
- [Episode API](./backend/src/docs/episode-api-docs.md)
- [Authentication API](./backend/src/docs/auth_user-api-docs.md)
- [Comment API](./backend/src/docs/comment-apis.md)
- [Genre API](./backend/src/docs/genre-api-docs.md)
- [Media Upload](./backend/src/docs/media-api-docs.md)
- [Statistics API](./backend/src/docs/stats-api-docs.md)

## 📂 Cấu trúc thư mục

```
Alldrama-version2/
├── 📁 frontend/          # Ứng dụng web chính (Next.js)
├── 📁 admin-fe/          # Panel quản trị (Next.js)
├── 📁 backend/           # API Backend (Node.js + Express)
│   ├── 📁 src/           # Source code
│   ├── 📁 hls-processor/ # Xử lý video HLS
│   └── 📁 cf-worker/     # Cloudflare Workers
└── 📄 README.md
```

## 🔐 Bảo mật

- ✅ JWT Authentication với refresh token
- ✅ Rate limiting
- ✅ CORS protection
- ✅ XSS protection
- ✅ SQL injection prevention
- ✅ File upload validation
- ✅ Environment variables protection

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 👨‍💻 Tác giả

**YudgnuH** - [GitHub](https://github.com/yudgunH)

## 📞 Liên hệ

- Email: ndhung0901@gmail.com
- GitHub: [@YudgnuH](https://github.com/yudgunH)
- LinkedIn: [Your LinkedIn](https://www.linkedin.com/in/h%C6%B0ng-nguy%E1%BB%85n-duy-685477295/)

## 🙏 Cảm ơn

- [Next.js](https://nextjs.org/) - React Framework
- [Shadcn UI](https://ui.shadcn.com/) - UI Components
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework
- [Express.js](https://expressjs.com/) - Backend Framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Caching
- [FFmpeg](https://ffmpeg.org/) - Video Processing

---

⭐ **Nếu dự án này hữu ích, hãy cho chúng tôi một star!** ⭐
