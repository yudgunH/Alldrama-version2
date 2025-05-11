import express from 'express';
import { 
  uploadMoviePoster,
  uploadMovieBackdrop,
  uploadMovieTrailer,
  uploadEpisodeVideo,
  getPresignedUploadUrl,
  deleteMedia,
  getVideoProcessingStatus,
  processVideo,
  deleteEpisode,
  deleteMovie,
  processVideoFromWorker,
  hlsProcessorCallback
} from '../controllers/mediaController';
import { imageUpload, videoUpload, validateFileType, authenticate, requireAdmin } from '../middleware';
import { uploadLimiter } from '../middleware/rateLimit';
import { runAsyncWrapper } from '../utils/runAsyncWrapper';

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

// Thêm route cho xử lý video từ worker
router.post('/process-video', runAsyncWrapper(processVideoFromWorker));

// Xử lý webhook từ Cloudflare Worker
router.post('/worker/process-video', runAsyncWrapper(processVideoFromWorker));

// Route xóa phương tiện của phim
router.delete('/movies/:movieId/:mediaType', authenticate, runAsyncWrapper(deleteMedia));

// Thêm route mới
// Callback từ container HLS processor
router.post('/hls-processor/callback', runAsyncWrapper(hlsProcessorCallback));

export default router; 