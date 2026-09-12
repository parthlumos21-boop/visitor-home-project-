const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const visits = await prisma.visit.findMany({ include: { visitor: true, host: true } });
  console.log(JSON.stringify(visits.map(v => ({
    id: v.id,
    visitorName: v.visitor?.name,
    hostName: v.host?.name,
    scheduledAt: v.scheduledAt,
    status: v.status
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
