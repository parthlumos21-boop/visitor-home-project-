const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const invitations = await prisma.invitation.count();
  console.log("Total invitations:", invitations);
}

main().catch(console.error).finally(() => prisma.$disconnect());
