import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { securityMiddleware, errorHandler } from './middleware';
import { globalLimiter } from './middleware/rateLimit';
import movieRoutes from "./routes/movieRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import watchHistoryRoutes from "./routes/watchHistoryRoutes";
import episodeRoutes from "./routes/episodeRoutes";
import genreRoutes from "./routes/genreRoutes";
import statsRoutes from "./routes/statsRoutes";
import viewRoutes from "./routes/viewRoutes";
import mediaRoutes from "./routes/mediaRoutes";
import commentRoutes from "./routes/commentRoutes";

// Khởi tạo Express app
const app = express();

// Middleware
// Tăng giới hạn kích thước body request lên 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Thêm middleware bảo mật
app.use(securityMiddleware);

// Áp dụng global rate limit cho tất cả các route
app.use(globalLimiter);

// CORS middleware
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? [process.env.FRONTEND_URL || 'https://alldrama.tech', 'https://next-auth.js.org']
//     : ['http://localhost:3000', 'http://localhost:3001', 'https://next-auth.js.org'],
//   credentials: true, // Quan trọng: cho phép gửi cookie qua CORS
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Worker-Secret', 'XSRF-TOKEN']
// }));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Worker-Secret', 'XSRF-TOKEN']
}));
app.options('*', cors({ origin: 'http://localhost:3000', credentials: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Alldrama API Documentation"
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/episodes', episodeRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/views', viewRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/comments', commentRoutes);

// Route mặc định
app.get("/", (req: Request, res: Response) => {
  res.send("Alldrama API - Phiên bản 1.0");
});

// Xử lý lỗi 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
});

// Middleware xử lý lỗi toàn cục (bao gồm cả lỗi CSRF)
app.use(errorHandler);

// Export app để sử dụng trong index.ts và tests
export default app; 