import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const visits = await prisma.visit.findMany({
    select: {
      id: true,
      visitorId: true,
      hostId: true,
      scheduledAt: true,
    }
  });
  console.log('Total visits:', visits.length);
  const seen = new Set();
  let duplicates = 0;
  for (const v of visits) {
    const key = `${v.visitorId}-${v.hostId}-${new Date(v.scheduledAt || Date.now()).toISOString().split('T')[0]}`;
    if (seen.has(key)) {
      console.log('Duplicate found:', v);
      duplicates++;
    }
    seen.add(key);
  }
  console.log('Total duplicates:', duplicates);
}
main().finally(() => prisma.$disconnect());
