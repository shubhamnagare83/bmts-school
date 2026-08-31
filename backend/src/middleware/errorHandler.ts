import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  const message = isProduction && status === 500
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
