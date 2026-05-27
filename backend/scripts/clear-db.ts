import { prisma } from '../src/prisma/client';

async function clearDb() {
  await prisma.$transaction(async (tx) => {
    await tx.couponUsage.deleteMany();
    await tx.warning.deleteMany();
    await tx.storeUserBlock.deleteMany();
    await tx.globalUserBlock.deleteMany();
    await tx.bookingItem.deleteMany();
    await tx.booking.deleteMany();
    await tx.cartItem.deleteMany();
    await tx.cart.deleteMany();
    await tx.campaign.deleteMany();
    await tx.item.deleteMany();
    await tx.storeOwnershipRequest.deleteMany();
    await tx.store.deleteMany();
    await tx.notificationPreference.deleteMany();
    await tx.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
  });
}

clearDb()
  .then(async () => {
    console.log('Database cleared (data only). Schema and migrations unchanged.');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
