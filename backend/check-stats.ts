import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkStats() {
  const totalVisits = await prisma.visit.count({
    where: { status: { in: ['APPROVED', 'CHECKED_IN', 'COMPLETED'] } }
  });
  console.log('Total Visits count: ' + totalVisits);
  
  const allVisits = await prisma.visit.findMany({
    where: { status: { in: ['APPROVED', 'CHECKED_IN', 'COMPLETED'] } }
  });
  console.log(allVisits.map(v => v.id + ' ' + v.displayId + ' ' + v.status));
}

checkStats().then(() => { prisma.$disconnect(); pool.end(); }).catch(console.error);
