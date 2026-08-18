import { prisma } from "../src/database/prisma.js";

const seed = async () => {
  await prisma.organization.upsert({
    where: { slug: "opsdesk-development" },
    update: { name: "OpsDesk Development" },
    create: {
      name: "OpsDesk Development",
      slug: "opsdesk-development",
    },
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
