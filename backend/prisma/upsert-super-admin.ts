import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const adminPhone = '+919999999999';
const adminName = 'Keval v shah';

async function main() {
  const passwordHash = await bcrypt.hash('keval@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'keval@swatiswitchgears.com' },
    update: {
      name: adminName,
      phone: adminPhone,
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name: adminName,
      email: 'keval@swatiswitchgears.com',
      phone: adminPhone,
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log('SUPER_ADMIN ready:', admin);
}

main()
  .catch((error) => {
    console.error('Failed to upsert SUPER_ADMIN:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
