import express from 'express';
import { Logger } from '../utils/logger';
import { authenticate, requireAdmin } from '../middleware';

const logger = Logger.getLogger('QueueDashboard');

// Hàm để setup Bull Board (sẽ được gọi sau khi dependencies được cài)
export const setupQueueDashboard = async (app: express.Application): Promise<void> => {
  try {
    // Dynamic import để tránh lỗi nếu BullMQ chưa được cài
    const { createBullBoard } = await import('@bull-board/api');
    const { BullMQAdapter } = await import('@bull-board/api/bullMQAdapter');
    const { ExpressAdapter } = await import('@bull-board/express');
    
    // Import queue service
    const hlsQueueService = await import('../services/queue/hlsQueueService');
    
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/api/queue/dashboard');

    createBullBoard({
      queues: [
        new BullMQAdapter(hlsQueueService.hlsQueueService.getQueue()) as any,
      ],
      serverAdapter: serverAdapter,
    });

    // Thêm authentication middleware cho dashboard
    app.use('/api/queue/dashboard',
      authenticate,
      requireAdmin,
      serverAdapter.getRouter()
    );

    logger.info('Queue Dashboard setup successfully at /api/queue/dashboard');
  } catch (error) {
    logger.warn('Queue Dashboard setup failed (this is expected if BullMQ dependencies are not installed):', error);
  }
};

// Route đơn giản để kiểm tra queue dashboard có sẵn không
const router = express.Router();

router.get('/dashboard-info', authenticate, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Queue Dashboard is available',
    dashboardUrl: '/api/queue/dashboard',
    note: 'Requires admin authentication'
  });
});

export default router; 