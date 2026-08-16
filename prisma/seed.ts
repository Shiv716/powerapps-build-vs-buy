import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { email: "vera.viewer@example.com", name: "Vera Viewer", roles: ["viewer"] },
  { email: "riley.reviewer@example.com", name: "Riley Reviewer", roles: ["viewer", "reviewer"] },
  { email: "avery.approver@example.com", name: "Avery Approver", roles: ["viewer", "approver"] },
  { email: "adrian.admin@example.com", name: "Adrian Admin", roles: ["viewer", "reviewer", "approver", "admin"] },
];

async function main() {
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, roles: user.roles },
      create: user,
    });
    console.log(`Seeded user ${record.email} [${record.roles.join(", ")}]`);
  }

  // No application resources exist yet; when a resource is added, seed its
  // fake data here so every tool is demonstrable out of the box.

  const userCount = await prisma.user.count();
  console.log(`Seed complete: ${userCount} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
