import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testRegister() {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@gmail.com' },
          { phone: '9999999999' }
        ]
      }
    });

    if (existingUser) {
      console.log('User already exists');
      return;
    }

    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@gmail.com',
        phone: '9999999999',
        passwordHash,
        role: 'VISITOR',
      }
    });
    console.log('User created:', user);
  } catch (error) {
    console.error('Error during register:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testRegister();
