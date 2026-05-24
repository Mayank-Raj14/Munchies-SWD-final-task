import type { ErrorRequestHandler } from 'express';

import { deleteUploadedFile } from '../utils/file-storage.js';

export const cleanupUploadedFileOnError: ErrorRequestHandler = async (error, req, _res, next) => {
  const file = req.file;

  if (file) {
    await deleteUploadedFile(`/uploads/items/${file.filename}`).catch(() => undefined);
  }

  next(error);
};
