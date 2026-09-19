import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting STRICT cleanup of duplicate NewAppointments...');
  const appointments = await prisma.newAppointment.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const seenApp = new Set();
  let deletedAppCount = 0;

  for (const app of appointments) {
    const vName = (app.fullName || '').toLowerCase().trim();
    const hName = (app.personToMeet || '').toLowerCase().trim();
    const dateStr = app.visitDate || '';
    const key = `${vName}-${hName}-${dateStr}`;

    if (seenApp.has(key)) {
      await prisma.newAppointment.delete({ where: { id: app.id } });
      deletedAppCount++;
      console.log(`Deleted duplicate NewAppointment: ${app.id} (${app.fullName})`);
    } else {
      seenApp.add(key);
    }
  }
  
  console.log(`Finished STRICT NewAppointment cleanup. Deleted ${deletedAppCount} duplicates.`);

  console.log('Starting STRICT cleanup of duplicate Visits...');
  const visits = await prisma.visit.findMany({
    include: {
      visitor: true,
      host: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const seenVisit = new Set();
  let deletedVisitCount = 0;

  for (const visit of visits) {
    if (!visit.scheduledAt) continue;
    const dateStr = new Date(visit.scheduledAt).toISOString().split('T')[0];
    const vName = (visit.visitor?.name || '').toLowerCase().trim();
    const hName = (visit.host?.name || '').toLowerCase().trim();
    const key = `${vName}-${hName}-${dateStr}`;

    if (seenVisit.has(key)) {
      await prisma.qrCode.deleteMany({ where: { visitId: visit.id } });
      await prisma.visit.delete({ where: { id: visit.id } });
      deletedVisitCount++;
      console.log(`Deleted duplicate Visit: ${visit.id}`);
    } else {
      seenVisit.add(key);
    }
  }

  console.log(`Finished STRICT Visit cleanup. Deleted ${deletedVisitCount} duplicates.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Done.');
  });
