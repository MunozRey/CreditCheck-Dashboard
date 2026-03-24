/**
 * Prisma client singleton.
 *
 * En entornos serverless (Vercel) cada invocación puede importar este módulo
 * de nuevo. Sin el singleton, cada request crearía un PrismaClient distinto,
 * agotando el pool de conexiones de la base de datos en segundos.
 *
 * La técnica estándar de Prisma para Next.js / serverless:
 * https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
