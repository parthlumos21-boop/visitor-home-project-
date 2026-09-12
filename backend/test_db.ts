import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const apps = await prisma.newAppointment.findMany({
    where: {
      OR: [
        { fullName: { contains: 'keval', mode: 'insensitive' } },
        { personToMeet: { contains: 'keval', mode: 'insensitive' } },
      ]
    }
  });
  console.log('NewAppointments for Keval:');
  console.log(JSON.stringify(apps.map(a => ({ id: a.id, fullName: a.fullName, personToMeet: a.personToMeet, date: a.visitDate })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
