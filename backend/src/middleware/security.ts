import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import xssClean from 'xss-clean';
import { doubleCsrf } from 'csrf-csrf';

// Middleware helmet để thiết lập nhiều HTTP header bảo mật
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://*'],
      connectSrc: ["'self'", 'https://*'],
      mediaSrc: ["'self'", 'https://*']
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
});

// Middleware xss-clean để tránh XSS
export const xssMiddleware = xssClean();

// Middleware ngăn chặn XSS từ các trường nhập liệu
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Loại bỏ script tags và các attribute nguy hiểm
        req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/g, '')
          .replace(/javascript:/gi, '');
      }
    }
  }
  next();
};

// Tạo middleware CSRF
const { generateToken, doubleCsrfProtection, validateRequest } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'csrf-secret-key',
  cookieName: '_csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  },
  size: 64, // Kích thước token
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
});

// Middleware CSRF protection
export const csrfProtection = doubleCsrfProtection;

// Middleware để xử lý lỗi CSRF
export const handleCsrfError = () => {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'INVALID_CSRF_TOKEN') {
      return res.status(403).json({ message: 'Phát hiện tấn công CSRF' });
    }
    next(err);
  };
};

// Middleware gửi CSRF token đến client
export const sendCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const token = generateToken(req, res);
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.locals.csrfToken = token; // Lưu token vào res.locals để sử dụng trong view
  next();
};

// Middleware để giới hạn kích thước request
export const limitRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] as string, 10) || 0;
  const MAX_SIZE = 50 * 1024 * 1024; // Tăng lên 50MB
  
  if (contentLength > MAX_SIZE) {
    return res.status(413).json({ message: 'Kích thước request quá lớn' });
  }
  
  next();
};

// Middleware để ngăn chặn clickjacking
export const noFrames = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// Middleware tổng hợp bao gồm tất cả middleware bảo mật
export const securityMiddleware = [
  helmetMiddleware,
  xssMiddleware,
  sanitizeInputs,
  limitRequestSize,
  noFrames
]; 