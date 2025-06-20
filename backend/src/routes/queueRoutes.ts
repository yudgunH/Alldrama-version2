import express from 'express';
import { 
  addHLSJob,
  getQueueStatus,
  getJobStatus,
  cancelJob,
  retryJob,
  getJobsByState,
  toggleQueue,
  debugRedis
} from '../controllers/queueController';
import { authenticate, requireAdmin } from '../middleware';
import { runAsyncWrapper } from '../utils/runAsyncWrapper';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     QueueStatus:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         queue:
 *           type: object
 *           properties:
 *             waiting:
 *               type: number
 *             active:
 *               type: number
 *             completed:
 *               type: number
 *             failed:
 *               type: number
 *             delayed:
 *               type: number
 *         concurrency:
 *           type: number
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/queue/add-hls-job:
 *   post:
 *     summary: Thêm job HLS vào queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoKey
 *               - movieId
 *               - episodeId
 *             properties:
 *               videoKey:
 *                 type: string
 *                 description: Key của video trên R2
 *               movieId:
 *                 type: number
 *                 description: ID của phim
 *               episodeId:
 *                 type: number
 *                 description: ID của tập phim
 *               priority:
 *                 type: number
 *                 description: Độ ưu tiên (số cao hơn = ưu tiên cao hơn)
 *                 default: 0
 *     responses:
 *       200:
 *         description: Job đã được thêm vào queue thành công
 *       400:
 *         description: Thiếu thông tin cần thiết
 *       401:
 *         description: Không có quyền truy cập
 */
router.post('/add-hls-job', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(addHLSJob)
);

/**
 * @swagger
 * /api/queue/status:
 *   get:
 *     summary: Lấy thông tin trạng thái queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin trạng thái queue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueueStatus'
 */
router.get('/status', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(getQueueStatus)
);

/**
 * @swagger
 * /api/queue/job/{jobId}:
 *   get:
 *     summary: Lấy thông tin chi tiết của job
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của job
 *     responses:
 *       200:
 *         description: Thông tin chi tiết của job
 *       404:
 *         description: Không tìm thấy job
 */
router.get('/job/:jobId', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(getJobStatus)
);

/**
 * @swagger
 * /api/queue/job/{jobId}/cancel:
 *   post:
 *     summary: Hủy job
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của job cần hủy
 *     responses:
 *       200:
 *         description: Job đã được hủy thành công
 *       404:
 *         description: Không tìm thấy job hoặc không thể hủy
 */
router.post('/job/:jobId/cancel', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(cancelJob)
);

/**
 * @swagger
 * /api/queue/job/{jobId}/retry:
 *   post:
 *     summary: Thử lại job thất bại
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của job cần thử lại
 *     responses:
 *       200:
 *         description: Job đã được queue để thử lại
 *       400:
 *         description: Chỉ có thể retry job đã thất bại
 *       404:
 *         description: Không tìm thấy job
 */
router.post('/job/:jobId/retry', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(retryJob)
);

/**
 * @swagger
 * /api/queue/jobs/{state}:
 *   get:
 *     summary: Lấy danh sách jobs theo trạng thái
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *           enum: [waiting, active, completed, failed, delayed]
 *         description: Trạng thái của jobs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *         description: Số lượng jobs tối đa
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           default: 0
 *         description: Vị trí bắt đầu
 *     responses:
 *       200:
 *         description: Danh sách jobs theo trạng thái
 *       400:
 *         description: Trạng thái không hợp lệ
 */
router.get('/jobs/:state', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(getJobsByState)
);

/**
 * @swagger
 * /api/queue/toggle:
 *   post:
 *     summary: Tạm dừng hoặc tiếp tục queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [pause, resume]
 *                 description: Hành động cần thực hiện
 *     responses:
 *       200:
 *         description: Queue đã được pause/resume thành công
 *       400:
 *         description: Action không hợp lệ
 */
router.post('/toggle', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(toggleQueue)
);

/**
 * @swagger
 * /api/queue/debug/redis:
 *   get:
 *     summary: Debug Redis connection
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Redis connection info
 */
router.get('/debug/redis', 
  authenticate, 
  requireAdmin, 
  runAsyncWrapper(debugRedis)
);

export default router; 