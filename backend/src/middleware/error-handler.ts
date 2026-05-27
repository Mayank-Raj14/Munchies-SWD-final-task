import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';

import { AppError } from '../utils/app-error.js';

type ApiErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

const sendError = (
  res: Parameters<ErrorRequestHandler>[2],
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) => {
  const payload: ApiErrorPayload = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  res.status(statusCode).json(payload);
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  void _next;

  if (error instanceof AppError) {
    sendError(
      res,
      error.statusCode,
      'APP_ERROR',
      error.message,
      error.details,
    );
    return;
  }

  if (error instanceof multer.MulterError) {
    sendError(res, 400, 'UPLOAD_ERROR', error.message);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(error);

    if (error.code === 'P2002') {
      sendError(
        res,
        409,
        'CONFLICT',
        'A record with these details already exists',
      );
      return;
    }

    if (error.code === 'P2003') {
      sendError(
        res,
        409,
        'RELATION_CONFLICT',
        'This record is linked to existing bookings or carts and cannot be removed yet',
      );
      return;
    }

    if (error.code === 'P2034') {
      sendError(
        res,
        409,
        'WRITE_CONFLICT',
        'Request conflicted with another update. Please retry.',
      );
      return;
    }

    sendError(
      res,
      400,
      'DATABASE_ERROR',
      error.message,
    );
    return;
  }

  if (
    error instanceof Error &&
    error.message === 'Only image uploads are allowed'
  ) {
    sendError(
      res,
      400,
      'VALIDATION_ERROR',
      error.message,
    );
    return;
  }

  console.error(error);

  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    'Internal server error',
  );
};