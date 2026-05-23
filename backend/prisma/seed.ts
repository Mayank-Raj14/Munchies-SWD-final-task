import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hostels = Array.from({ length: 12 }, (_, index) => ({
  name: `Hostel ${index + 1}`,
}));

const main = async () => {
  for (const hostel of hostels) {
    await prisma.hostel.upsert({
      where: { name: hostel.name },
      update: {},
      create: hostel,
    });
  }
};

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
