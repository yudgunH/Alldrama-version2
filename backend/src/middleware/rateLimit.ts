import rateLimit from 'express-rate-limit';

// Middleware giới hạn số lượng request cho tất cả các endpoint
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn mỗi IP chỉ được gửi 100 request trong 15 phút
  standardHeaders: true, // Trả về thông tin rate limit trong header `RateLimit-*`
  legacyHeaders: false, // Vô hiệu hóa header `X-RateLimit-*`
  message: {
    message: 'Quá nhiều request từ địa chỉ IP này, vui lòng thử lại sau.',
  },
});

// Middleware giới hạn số lượng request cho các endpoint đăng nhập để ngăn tấn công brute force
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // Giới hạn mỗi IP chỉ được gửi 5 request đăng nhập thất bại trong 1 giờ
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Chỉ đếm các request thất bại
  message: {
    message: 'Quá nhiều request đăng nhập thất bại từ địa chỉ IP này, vui lòng thử lại sau 1 giờ.',
  },
});

// Middleware giới hạn số lượng request cho API register để ngăn spam
export const registerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 giờ
  max: 3, // Giới hạn mỗi IP chỉ được đăng ký 3 tài khoản trong 24 giờ
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Quá nhiều yêu cầu đăng ký từ địa chỉ IP này, vui lòng thử lại sau 24 giờ.',
  },
});

// Middleware giới hạn số lượng request cho các API upload media
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // Giới hạn mỗi IP chỉ được upload 10 file trong 1 giờ
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Quá nhiều yêu cầu upload từ địa chỉ IP này, vui lòng thử lại sau 1 giờ.',
  },
}); 