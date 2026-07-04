import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";
import "dotenv/config";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 3306,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

const connect = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

const disconnect = async () => {
  await prisma.$disconnect();
  console.log("Database disconnected");
};

export { prisma, connect, disconnect };
