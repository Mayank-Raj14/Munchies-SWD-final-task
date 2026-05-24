import path from 'node:path';
import fs from 'node:fs';

import multer from 'multer';

const uploadDir = path.join(process.cwd(), 'uploads', 'items');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = EXTENSION_BY_MIME[file.mimetype] ?? '.jpg';
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  },
});

export const uploadItemImage = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!file.mimetype.startsWith('image/') || !ALLOWED_EXTENSIONS.has(extension)) {
      callback(new Error('Only JPG, PNG, WebP, or GIF uploads are allowed'));
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
