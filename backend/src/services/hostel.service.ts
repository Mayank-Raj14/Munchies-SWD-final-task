import { prisma } from '../prisma/client.js';

const defaultHostelNames = [
  'Valmiki',
  'Vishwakarma',
  'Shankar',
  'Vyas',
  'Ram',
  'Krishna',
  'Budh',
  'Gandhi',
  'Malaviya',
  'Ganga',
  'Gautam',
  'Meera',
];

/** Seed default hostels once at startup — not on every public read. */
export const ensureDefaultHostels = async () => {
  await prisma.$transaction(
    defaultHostelNames.map((name) =>
      prisma.hostel.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
};

export const listHostels = async () =>
  prisma.hostel.findMany({
    orderBy: { name: 'asc' },
  });
