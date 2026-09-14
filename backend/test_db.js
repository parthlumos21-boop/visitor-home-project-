const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.invitation.findMany().then(invs => {
  console.log(JSON.stringify(invs.map(i => ({ id: i.id, createdByName: i.createdByName })), null, 2));
}).catch(console.error).finally(() => prisma.$disconnect());
