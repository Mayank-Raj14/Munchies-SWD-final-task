import { prisma } from '../prisma/client.js';

const defaultHostelNames = [
  'Valmiki',
  'Vishwakarma',
  'Gautam',
  'Shankar',
  'Vyas',
  'Ram',
  'Krishna',
  'Budh',
  'Gandhi',
  'Meera',
  'Malviya',
  'Ganga',
];

/**
 * Seed default hostels at startup.
 * Fully idempotent + safe under rebuilds/restarts.
 */
export const ensureDefaultHostels = async () => {
  const existingCount = await prisma.hostel.count();

  if (existingCount > 0) {
    console.log('Default hostels already exist');
    return;
  }

  // If hostel table is empty, insert all 12.
  // skipDuplicates keeps this safe even if concurrent startup happens.
  await prisma.hostel.createMany({
    data: defaultHostelNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log('Default hostels seeded');
};

export const listHostels = async () =>
  prisma.hostel.findMany({
    orderBy: { name: 'asc' },
  });
