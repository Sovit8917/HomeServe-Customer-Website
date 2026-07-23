import { PrismaClient } from '@prisma/client';

// Standard Next.js pattern: avoid creating a new PrismaClient (and new DB
// connection pool) on every hot-reload in dev. This client is used ONLY
// by Better Auth (lib/auth.ts) — all other data access in this app goes
// through the NestJS backend API, not directly to the database.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
