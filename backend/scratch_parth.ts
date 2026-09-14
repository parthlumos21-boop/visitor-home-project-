import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const email = 'parthlu21@gmail.com';
  console.log(`Checking user: ${email}`);
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('User:', user);
  
  const visitorProfile = await prisma.visitorProfile.findFirst({
    where: { OR: [{ email }, { phone: user?.phone || 'none' }] }
  });
  console.log('VisitorProfile:', visitorProfile);

  const invitations = await prisma.invitation.findMany({
    where: { OR: [{ email }, { mobile: user?.phone || 'none' }] }
  });
  console.log('Invitations count:', invitations.length);

  const newAppointments = await prisma.newAppointment.findMany({
    where: { OR: [{ email }, { mobile: user?.phone || 'none' }] }
  });
  console.log('NewAppointments count:', newAppointments.length);
  
  await prisma.$disconnect();
}

check().catch(console.error);
