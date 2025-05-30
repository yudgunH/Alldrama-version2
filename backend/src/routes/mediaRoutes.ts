import express from 'express';
import { 
  uploadMoviePoster,
  uploadMovieBackdrop,
  uploadMovieTrailer,
  uploadEpisodeVideo,
  getPresignedUploadUrl,
  deleteMedia,
  getVideoProcessingStatus,
  getDetailedProcessingStatus,
  getMovieProcessingStatus,
  processVideo,
  deleteEpisode,
  deleteMovie,
  processVideoFromWorker,
  hlsProcessorCallback
} from '../controllers/mediaController';
import { imageUpload, videoUpload, validateFileType, authenticate, requireAdmin } from '../middleware';
import { uploadLimiter } from '../middleware/rateLimit';
import { runAsyncWrapper } from '../utils/runAsyncWrapper';
import { Request, Response } from 'express';
import * as mediaController from '../controllers/mediaController';

const router = express.Router();

// Routes cho phim
router.post('/movies/:movieId/poster', 
  authenticate, 
  requireAdmin, 
  imageUpload.single('poster'),
  validateFileType(['image/']),
  uploadLimiter,
  uploadMoviePoster
);

router.post('/movies/:movieId/backdrop',
  authenticate,
  requireAdmin,
  imageUpload.single('backdrop'),
  validateFileType(['image/']),
  uploadLimiter,
  uploadMovieBackdrop
);

router.post('/movies/:movieId/trailer',
  authenticate,
  requireAdmin,
  videoUpload.single('trailer'),
  validateFileType(['video/']),
  uploadLimiter,
  uploadMovieTrailer
);

// Routes cho tập phim
router.post('/episodes/:movieId/:episodeId/video',
  authenticate,
  requireAdmin,
  videoUpload.single('video'),
  validateFileType(['video/']),
  uploadLimiter,
  uploadEpisodeVideo
);

// Thêm endpoint để notify video đã upload (cho phương pháp dự phòng)
router.post('/episodes/:movieId/:episodeId/video-uploaded',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await mediaController.notifyVideoUploaded(req, res);
  }
);

// Route tạo presigned URL
router.post('/presigned-url',
  authenticate,
  requireAdmin,
  getPresignedUploadUrl
);

// Route để xóa media (cũ, giữ lại để tương thích ngược)
router.delete('/:key',
  authenticate,
  requireAdmin,
  deleteMedia
);

// Routes mới để xóa media cụ thể
router.delete('/movies/:movieId/:mediaType',
  authenticate,
  requireAdmin,
  deleteMedia
);

// Route để xóa tập phim
router.delete('/episodes/:movieId/:episodeId',
  authenticate,
  requireAdmin,
  deleteEpisode
);

// Route để xóa toàn bộ phim
router.delete('/movies/:movieId',
  authenticate,
  requireAdmin,
  deleteMovie
);

// Route lấy trạng thái xử lý video
router.get('/episodes/:episodeId/processing-status',
  authenticate,
  getVideoProcessingStatus
);

// Route lấy trạng thái xử lý video chi tiết (bao gồm thông tin từ job-metadata)
router.get('/episodes/:movieId/:episodeId/processing-status-detailed',
  authenticate,
  getDetailedProcessingStatus
);

// Thêm route cho xử lý video từ worker
router.post('/process-video', runAsyncWrapper(processVideoFromWorker));

// Xử lý webhook từ Cloudflare Worker
router.post('/worker/process-video', runAsyncWrapper(processVideoFromWorker));

// Route xóa phương tiện của phim
router.delete('/movies/:movieId/:mediaType', authenticate, runAsyncWrapper(deleteMedia));

// Thêm route mới
// Callback từ container HLS processor
router.post('/hls-processor/callback', runAsyncWrapper(hlsProcessorCallback));

// Route lấy trạng thái xử lý của tất cả tập phim trong một phim
router.get('/movies/:movieId/processing-status',
  authenticate,
  getMovieProcessingStatus
);

// === ADMIN R2 MANAGEMENT ENDPOINTS ===

// Liệt kê files trên R2 theo prefix (để debug)
router.get('/admin/r2/list/:prefix(*)', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await mediaController.listR2Files(req, res);
});

// Xóa tất cả file theo prefix (nguy hiểm - chỉ admin)
router.delete('/admin/r2/prefix/:prefix(*)', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await mediaController.deleteFilesByPrefix(req, res);
});

// Xóa file đơn lẻ theo key
router.delete('/admin/r2/file/:key(*)', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await mediaController.deleteR2File(req, res);
});

export default router; 