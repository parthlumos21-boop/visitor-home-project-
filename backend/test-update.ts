import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const id = "53d8e7eb-e035-46c3-93e1-681182eac06c";
    const status = "REJECTED";
    const visit = await prisma.visit.update({
      where: { id },
      data: { status },
      include: { host: true, visitor: true }
    });
    console.log("SUCCESS:", visit);
  } catch (e) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
