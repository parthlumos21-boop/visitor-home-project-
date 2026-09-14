import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({ where: { name: { contains: 'Keval' } } });
  console.log('User:', user);
  if (!user) {
    console.log("User not found");
    return;
  }
  try {
    const notifs = await prisma.notification.findMany({ where: { recipientId: user.id } });
    console.log('Notifs:', notifs);
  } catch (e) {
    console.error('Prisma Error:', e);
  }
}

main().finally(() => process.exit(0));
