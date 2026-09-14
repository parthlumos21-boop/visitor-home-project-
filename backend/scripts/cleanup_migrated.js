const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up old migrated invitations from NewAppointment...');

  // Find all invitations
  const invitations = await prisma.invitation.findMany();

  let deletedCount = 0;

  for (const inv of invitations) {
    // Find matching appointment by mobile, visitDate, and personToMeet
    const appointment = await prisma.newAppointment.findFirst({
      where: {
        mobile: inv.mobile,
        personToMeet: inv.personToMeet,
        visitDate: inv.visitDate
      }
    });

    if (appointment) {
      await prisma.newAppointment.delete({
        where: { id: appointment.id }
      });
      console.log(`Deleted migrated appointment: ${appointment.appointmentId}`);
      deletedCount++;
    }
  }

  console.log(`Cleanup complete! Deleted ${deletedCount} old appointments.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
