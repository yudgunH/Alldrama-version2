import express, { Request, Response } from "express";
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

// Built-in middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://alldrama.tech', 'https://next-auth.js.org']
  : ['http://localhost:3000', 'http://localhost:3001', 'https://next-auth.js.org'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      // Allow requests with no origin (e.g., Postman, mobile apps)
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Worker-Secret', 'XSRF-TOKEN'],
};

// Apply CORS middleware early
app.use(cors(corsOptions));
// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Security and rate limiting
app.use(securityMiddleware);
app.use(globalLimiter);

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

// Default route
app.get("/", (req: Request, res: Response) => {
  res.send("Alldrama API - Phiên bản 1.0");
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
});

// Global error handler (including CSRF errors)
app.use(errorHandler);

export default app;
