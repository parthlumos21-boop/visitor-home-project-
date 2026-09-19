import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.user.findMany().then(users => {
  console.log('USERS IN DB:');
  users.forEach(u => console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
  prisma.$disconnect();
  pool.end();
}).catch(console.error);
