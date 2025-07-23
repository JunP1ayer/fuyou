import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line no-unused-vars
  _next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    statusCode,
    isOperational,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  res.status(statusCode).json({
    error: {
      message: error.message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};