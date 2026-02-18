import { PrismaClient } from '@prisma/client';

// Éviter les connexions multiples en développement avec hot-reload
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Use explicit DATABASE_URL as fallback
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/droitdatabase';

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;

