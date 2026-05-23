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
    if (error.code === 'P2002') {
      res.status(409).json({
        message: 'A record with these details already exists',
      });
      return;
    }

    if (error.code === 'P2003') {
      res.status(409).json({
        message:
          'This record is linked to existing bookings or carts and cannot be removed yet',
      });
      return;
    }

    res.status(400).json({
      message: 'Database request failed',
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
