require("dotenv").config();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

async function main() {
  const role = process.argv[2] || "SUPER_ADMIN"; // node generate-token.js STORE_ADMIN

  let user = await prisma.user.findFirst({
    where: { role, deletedAt: null },
  });

  // Kalau belum ada, bikin dummy user langsung (skip endpoint register)
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: `Dummy ${role}`,
        email: `dummy.${role.toLowerCase()}@freshmart.test`,
        passwordHash: "dummy-hash-not-real", // gak dipakai buat login asli
        role,
        isVerified: true,
      },
    });
    console.log(`User dummy dibuat: ${user.email}`);
  }

  const payload = {
    id: user.id,
    role: user.role,
    storeId: user.storeId,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

  console.log("User:", user.email, "| role:", user.role, "| id:", user.id);
  console.log("Token:\n" + token);

  await prisma.$disconnect();
}

main();