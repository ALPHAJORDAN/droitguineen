import { PrismaClient } from '@prisma/client';

// Éviter les connexions multiples en développement avec hot-reload
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL environment variable is required in production');
    }
    console.warn('DATABASE_URL not set — using default local development URL');
}

// Append connection pool settings if not already present
const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/droitdatabase';
const databaseUrl = rawUrl.includes('connection_limit')
    ? rawUrl
    : `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}connection_limit=10&pool_timeout=10`;

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

