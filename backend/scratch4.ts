import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const u = await prisma.user.findUnique({ where: { email: 'parthlumos21@gmail.com' }});
  console.log('parth user:', u);
  await prisma.$disconnect();
}
check();
