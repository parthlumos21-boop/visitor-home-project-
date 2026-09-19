const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.newAppointment.findMany({
    where: { status: 'APPROVED' }
  });

  let potentialInvitations = 0;
  for (const app of appointments) {
    if (app.decidedAt) {
      const diff = Math.abs(app.decidedAt.getTime() - app.createdAt.getTime());
      if (diff < 1000) { // within 1 second
        potentialInvitations++;
      }
    }
  }

  const visits = await prisma.visit.findMany({
    where: { createdBy: { not: null } }
  });

  console.log(`Total approved appointments: ${appointments.length}`);
  console.log(`Potential invitations (createdAt ~= decidedAt): ${potentialInvitations}`);
  console.log(`Total visits with createdBy != null: ${visits.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
