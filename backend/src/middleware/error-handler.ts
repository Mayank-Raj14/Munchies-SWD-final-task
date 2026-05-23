import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';

import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      message: error.message,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(error.code === 'P2002' ? 409 : 400).json({
      message:
        error.code === 'P2002'
          ? 'A record with these details already exists'
          : 'Database request failed',
    });
    return;
  }

  if (error instanceof Error && error.message === 'Only image uploads are allowed') {
    res.status(400).json({
      message: error.message,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    message: 'Internal server error',
  });
};
