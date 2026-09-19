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

async function main() {
  const passwordHash = await bcrypt.hash('Parth@21', 10);

  const user = await prisma.user.upsert({
    where: { email: 'parthlu21@gmail.com' },
    update: {
      passwordHash,
      role: 'VISITOR', 
    },
    create: {
      name: 'Parth',
      email: 'parthlu21@gmail.com',
      passwordHash,
      role: 'VISITOR', 
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log('User successfully created/updated in Postgres:', user);
}

main()
  .catch((error) => {
    console.error('Failed to create user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
