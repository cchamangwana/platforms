import { PrismaClient } from "./generated/prisma";

/**
 * Prisma Client Singleton
 *
 * This prevents multiple instances of Prisma Client in development
 * due to hot reloading. In production, a single instance is used.
 *
 * Learn more about this pattern:
 * https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
