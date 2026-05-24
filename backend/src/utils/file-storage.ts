import fs from 'node:fs/promises';
import path from 'node:path';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');

export const deleteUploadedFile = async (url?: string | null) => {
  if (!url?.startsWith('/uploads/')) {
    return;
  }

  const filePath = path.resolve(process.cwd(), url.slice(1));

  if (!filePath.startsWith(uploadsRoot)) {
    return;
  }

  await fs.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  });
};
