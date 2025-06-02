import { Request, Response, NextFunction } from 'express';

/**
 * Bọc các hàm xử lý async/await trong Express để xử lý lỗi
 * 
 * @param fn Hàm xử lý async
 * @returns Hàm middleware Express
 */
export const runAsyncWrapper = (fn: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}; 