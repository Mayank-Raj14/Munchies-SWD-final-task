import { Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { normalizeSearchQuery } from '../utils/search.js';

export const searchUsersForAdmin = async (rawQuery: string) => {
  const query = normalizeSearchQuery(rawQuery);

  if (!query) {
    return { users: [] as Array<{ id: string; name: string; email: string }> };
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        // allow UUID exact match
        { id: { equals: query } },
        // fuzzy match for name/email
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  });

  return { users };
};


export const listStoresForAdmin = async () => {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return { stores };
};

export const assertAdmin = (role: Role) => {
  if (role !== Role.ADMIN) {
    throw new AppError('Admin access required', 403);
  }
};

