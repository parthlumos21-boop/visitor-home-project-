import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanupDuplicates() {
  console.log('Starting duplicate cleanup...');
  
  const appointments = await prisma.newAppointment.findMany({
    orderBy: { createdAt: 'desc' }
  });

  let deletedCount = 0;
  let updatedCount = 0;

  const visits = await prisma.visit.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const seen = new Set<string>();
  
  for (const visit of visits) {
    const day = new Date(visit.scheduledAt).toISOString().split('T')[0];
    const key = visit.visitorId + '-' + visit.hostId + '-' + day;
    
    if (seen.has(key)) {
      if (visit.status === 'PENDING' || visit.status === 'APPROVED') {
        console.log('Deleting duplicate visit: ' + visit.id);
        await prisma.qrCode.deleteMany({ where: { visitId: visit.id } });
        await prisma.visit.delete({ where: { id: visit.id } });
        deletedCount++;
      }
    } else {
      seen.add(key);
      
      if (visit.displayId && visit.displayId.startsWith('VIS-')) {
        const appt = appointments.find(a => 
          new Date(a.createdAt).toISOString().split('T')[0] === day &&
          (a.status === 'REGISTERED' || a.status === 'APPROVED' || a.status === 'CHECKED_IN' || a.status === 'COMPLETED')
        );
        if (appt && !visit.displayId.startsWith('APT-')) {
          try {
            await prisma.visit.update({
              where: { id: visit.id },
              data: { displayId: appt.appointmentId }
            });
            updatedCount++;
            console.log('Linked visit ' + visit.id + ' to appointment ' + appt.appointmentId);
          } catch (e) {
          }
        }
      }
    }
  }

  console.log('Cleanup complete. Deleted: ' + deletedCount + ', Linked: ' + updatedCount);
}

cleanupDuplicates().then(() => { prisma.$disconnect(); pool.end(); }).catch(console.error);
