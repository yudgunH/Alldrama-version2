import { Logger } from './utils/logger';
import dotenv from "dotenv";
import app from "./app";
import createDatabase from "./utils/createDatabase";
import initDatabase from "./utils/initDatabase";
import { startViewsSyncJob } from "./jobs/syncViewsJob";
import hlsQueueService from "./services/queue/hlsQueueService";
import os from 'os';
import path from 'path';

const logger = Logger.getLogger('index');

// Tải biến môi trường
dotenv.config();

const PORT = process.env.PORT || 5000;
const isFullLoggingEnabled = process.env.ENABLE_FULL_LOGGING === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';
const logFilePath = process.env.LOG_FILE_PATH || './logs/app.log';

// Xử lý sự kiện không bắt được
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${promise}, reason: ${reason}`);
  process.exit(1);
});

/**
 * Hiển thị thông tin hệ thống
 */
function logSystemInfo() {
  logger.debug('========== THÔNG TIN HỆ THỐNG ==========');
  logger.debug(`Phiên bản Node.js: ${process.version}`);
  logger.debug(`Hệ điều hành: ${os.type()} ${os.release()}`);
  logger.debug(`CPU: ${os.cpus()[0].model} (${os.cpus().length} cores)`);
  logger.debug(`Memory: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`);
  logger.debug(`Thư mục hiện tại: ${process.cwd()}`);
  logger.debug(`Môi trường: ${NODE_ENV}`);
  logger.debug(`Logging đầy đủ: ${isFullLoggingEnabled ? 'BẬT' : 'TẮT'}`);
  logger.debug(`File log: ${path.resolve(logFilePath)}`);
  logger.debug('========================================');
  
  // Test debug và info log
  logger.debug('Đây là thông báo DEBUG - chỉ hiển thị khi development hoặc ENABLE_FULL_LOGGING=true');
  logger.info('Đây là thông báo INFO - chỉ hiển thị khi development hoặc ENABLE_FULL_LOGGING=true');
  logger.warn('Đây là thông báo WARN - luôn hiển thị');
  logger.error('Đây là thông báo ERROR - luôn hiển thị');
}

// Khởi động server
const startServer = async () => {
  try {
    // In thông tin hệ thống
    logSystemInfo();
    
    // Tạo database nếu chưa tồn tại
    await createDatabase();
    
    // Khởi tạo kết nối database
    await initDatabase();
    
    // Khởi động cron job đồng bộ lượt xem từ Redis vào database
    startViewsSyncJob();
    
    // Khởi động HLS Queue Service
    try {
      await hlsQueueService.start();
      logger.info('HLS Queue Service started successfully');
    } catch (error) {
      logger.error('Failed to start HLS Queue Service:', error);
      // Không exit vì queue service không phải critical service
    }

    // Lắng nghe kết nối
    const server = app.listen(PORT, () => {
      logger.debug(`Server đang chạy trên port ${PORT}`);
      console.log(`===== Server đang chạy trên port ${PORT} =====`);
      console.log(`Môi trường: ${NODE_ENV}`);
      console.log(`Logging đầy đủ: ${isFullLoggingEnabled ? 'BẬT' : 'TẮT'}`);
      console.log(`File log: ${path.resolve(logFilePath)}`);
      console.log('=========================================');
    });

    // Xử lý graceful shutdown
    const gracefulShutdown = async () => {
      logger.debug('Đang đóng server...');
      
      // Dừng queue service trước
      try {
        await hlsQueueService.stop();
        logger.info('HLS Queue Service stopped');
      } catch (error) {
        logger.error('Error stopping HLS Queue Service:', error);
      }
      
      server.close(() => {
        logger.debug('Server đã đóng.');
        process.exit(0);
      });
      
      // Nếu server không đóng trong 10 giây, tắt cưỡng bức
      setTimeout(() => {
        logger.error('Không thể đóng server một cách bình thường, tắt cưỡng bức.');
        process.exit(1);
      }, 10000);
    };

    // Lắng nghe các tín hiệu tắt server
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error("Không thể khởi động server:", error);
    process.exit(1);
  }
};

startServer(); 