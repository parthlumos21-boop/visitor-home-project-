import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Create an Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+1234567890',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);

  // 2. Create an Employee User (Host)
  const employeePassword = await bcrypt.hash('employee123', 10);
  const host = await prisma.user.upsert({
    where: { email: 'host@example.com' },
    update: {},
    create: {
      name: 'Host Employee',
      email: 'host@example.com',
      phone: '+0987654321',
      passwordHash: employeePassword,
      role: 'EMPLOYEE',
    },
  });
  console.log(`Created host employee with id: ${host.id}`);

  // 3. Create a Visitor Profile
  const visitor = await prisma.visitorProfile.create({
    data: {
      name: 'John Smith',
      phone: '+1122334455',
      email: 'john.smith@example.com',
      idType: 'Driving License',
      idNumber: 'DL12345678',
    },
  });
  console.log(`Created visitor profile with id: ${visitor.id}`);

  // 4. Create a Visit
  const visit = await prisma.visit.create({
    data: {
      visitorId: visitor.id,
      hostId: host.id,
      purpose: 'Business Meeting',
      scheduledAt: new Date(),
      status: 'APPROVED',
      createdBy: visitor.id,
    },
  });
  console.log(`Created visit with id: ${visit.id}`);

  // 5. Create a QR Code for the Visit
  const qrCode = await prisma.qrCode.upsert({
    where: { visitId: visit.id },
    update: {},
    create: {
      visitId: visit.id,
      token: `VIS-${visit.id.substring(0, 8).toUpperCase()}`,
      expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // expires in 24 hours
    },
  });
  console.log(`Created QR code for visit: ${qrCode.token}`);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
