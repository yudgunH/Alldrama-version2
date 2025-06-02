import express, { Request, Response } from 'express';
import * as commentController from '../controllers/commentController';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của bình luận
 *         movieId:
 *           type: integer
 *           description: ID của phim
 *         userId:
 *           type: integer
 *           description: ID của người dùng
 *         userName:
 *           type: string
 *           description: Tên người dùng
 *         comment:
 *           type: string
 *           description: Nội dung bình luận
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/comments/all:
 *   get:
 *     summary: Lấy tất cả bình luận trong hệ thống (admin only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bình luận trên mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Thứ tự sắp xếp
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID phim
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID người dùng
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm trong nội dung bình luận và tên người dùng
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 */
router.get('/all', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await commentController.getAllComments(req, res);
});

/**
 * @swagger
 * /api/comments/latest:
 *   get:
 *     summary: Lấy bình luận mới nhất
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng bình luận muốn lấy
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/latest', async (req: Request, res: Response) => {
  await commentController.getLatestComments(req, res);
});

/**
 * @swagger
 * /api/comments/my:
 *   get:
 *     summary: Lấy bình luận của chính mình
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bình luận trên mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/my', authenticate, async (req: Request, res: Response) => {
  await commentController.getMyComments(req, res);
});

/**
 * @swagger
 * /api/comments/stats:
 *   get:
 *     summary: Lấy thống kê bình luận (admin only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalComments:
 *                   type: integer
 *                 commentsToday:
 *                   type: integer
 *                 commentsThisWeek:
 *                   type: integer
 *                 commentsThisMonth:
 *                   type: integer
 *                 topCommentedMovies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       movieId:
 *                         type: integer
 *                       movieTitle:
 *                         type: string
 *                       commentCount:
 *                         type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 */
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await commentController.getCommentsStats(req, res);
});

/**
 * @swagger
 * /api/comments/user/{userId}:
 *   get:
 *     summary: Lấy bình luận theo người dùng
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bình luận trên mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  await commentController.getCommentsByUser(req, res);
});

/**
 * @swagger
 * /api/comments/movies/{movieId}:
 *   get:
 *     summary: Lấy danh sách bình luận cho một phim
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phim
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bình luận trên mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Trường sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/movies/:movieId', optionalAuth, async (req: Request, res: Response) => {
  await commentController.getMovieComments(req, res);
});

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Tạo bình luận mới
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *               - comment
 *             properties:
 *               movieId:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo bình luận thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy phim hoặc người dùng
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  await commentController.createComment(req, res);
});

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Lấy chi tiết bình luận
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bình luận
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Không tìm thấy bình luận
 */
router.get('/:id', async (req: Request, res: Response) => {
  await commentController.getCommentById(req, res);
});

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Cập nhật bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bình luận
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật bình luận thành công
 *       400:
 *         description: Nội dung bình luận không được để trống
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền sửa bình luận này
 *       404:
 *         description: Không tìm thấy bình luận
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  await commentController.updateComment(req, res);
});

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Xóa bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bình luận
 *     responses:
 *       200:
 *         description: Xóa bình luận thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền xóa bình luận này
 *       404:
 *         description: Không tìm thấy bình luận
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  await commentController.deleteComment(req, res);
});

export default router; 