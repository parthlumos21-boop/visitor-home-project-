const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting migration...');

  // Find all visits that were created by an internal user
  const internalVisits = await prisma.visit.findMany({
    where: { createdBy: { not: null } },
    include: { visitor: true, host: true }
  });

  let migratedCount = 0;

  for (const visit of internalVisits) {
    // Find matching appointment
    // Usually they share phone and personToMeet
    const appointment = await prisma.newAppointment.findFirst({
      where: {
        mobile: visit.visitor.phone,
        personToMeet: visit.host.name,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (appointment) {
      // Check if it's already migrated (has an invitation)
      const existingInvitation = await prisma.invitation.findFirst({
        where: { mobile: appointment.mobile, visitDate: appointment.visitDate, personToMeet: appointment.personToMeet }
      });

      if (!existingInvitation) {
        // Create an invitation
        const invitationCount = await prisma.invitation.count();
        const invitationId = `INV-${String(invitationCount + 1).padStart(6, '0')}`;

        await prisma.invitation.create({
          data: {
            invitationId,
            fullName: appointment.fullName,
            mobile: appointment.mobile,
            email: appointment.email,
            company: appointment.company,
            visitorType: appointment.visitorType,
            purpose: appointment.purpose,
            personToMeet: appointment.personToMeet,
            department: appointment.department,
            visitDate: appointment.visitDate,
            arrivalTime: appointment.arrivalTime,
            vehicleNumber: appointment.vehicleNumber,
            notes: appointment.notes,
            status: appointment.status,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
            createdBy: visit.createdBy,
            createdByName: appointment.decidedByName || appointment.personToMeet,
          }
        });

        console.log(`Migrated appointment ${appointment.appointmentId} to invitation ${invitationId}`);
        migratedCount++;
      }
    }
  }

  console.log(`Migration complete! Migrated ${migratedCount} old invitations.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
