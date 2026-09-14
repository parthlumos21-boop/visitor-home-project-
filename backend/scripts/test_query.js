const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const appointments = await prisma.newAppointment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log("Recent appointments:", JSON.stringify(appointments, null, 2));
  
  const visits = await prisma.visit.findMany({
    where: { createdBy: { not: null } },
    take: 5,
    include: { visitor: true, host: true }
  });
  console.log("Internal created visits:", JSON.stringify(visits, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
