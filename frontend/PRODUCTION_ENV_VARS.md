# Environment Variables cho Production

## Biến môi trường bắt buộc

### 1. API Configuration

```bash
NEXT_PUBLIC_API_URL=https://alldramaz.com
```

- Đây là base URL của backend API
- Phải có `/api` sẽ được thêm tự động trong service

### 2. Site URL

```bash
NEXT_PUBLIC_SITE_URL=https://alldrama.net
```

- URL chính của trang web
- Dùng cho Open Graph metadata và social sharing

### 3. Environment

```bash
NODE_ENV=production
```

- Môi trường production
- Ảnh hưởng đến error handling và fallback behavior

## Test API Connection

Chạy script để test API:

```bash
node debug-movie-api.js
```

## Debug Production Issues

### 1. Test metadata generation:

Truy cập: `https://your-domain.com/api/test-movie/20`

### 2. Check server logs:

```bash
# Xem logs trong production console
# Tìm các log bắt đầu với emoji:
# 🎬 [ServerMovieService]
# 🌐 [ServerMovieService]
# ✅ [generateMetadata]
# ⚠️ [generateMetadata]
```

### 3. Test social sharing:

- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Test URL: `https://your-domain.com/movie/20`

## Fallback Behavior

- Nếu API không khả dụng → Sử dụng fallback metadata với logo AllDrama
- Nếu movie không tồn tại → Return 404 với fallback metadata
- Timeout: 10 giây cho API requests
- Cache: 1 giờ cho successful responses
