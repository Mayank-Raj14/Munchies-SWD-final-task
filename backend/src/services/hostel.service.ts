import { prisma } from '../prisma/client.js';

export const listHostels = async () => {
  return prisma.hostel.findMany({
    orderBy: { name: 'asc' },
  });
};
