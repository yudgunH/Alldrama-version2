import express, { Request, Response } from 'express';
import * as episodeController from '../controllers/episodeController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Lấy danh sách tập phim của một phim
router.get('/movie/:movieId', async (req: Request, res: Response) => {
  await episodeController.getEpisodesByMovieId(req, res);
});

// Lấy chi tiết tập phim
router.get('/:id', async (req: Request, res: Response) => {
  await episodeController.getEpisodeById(req, res);
});

// Tạo tập phim mới (chỉ admin)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await episodeController.createEpisode(req, res);
});

// Cập nhật tập phim (chỉ admin)
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await episodeController.updateEpisode(req, res);
});

// Xóa tập phim (chỉ admin)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await episodeController.deleteEpisode(req, res);
});

// Xóa tất cả file R2 của tập phim mà không xóa record database - chỉ admin
router.delete('/:id/files', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await episodeController.deleteEpisodeFiles(req, res);
});

export default router; 