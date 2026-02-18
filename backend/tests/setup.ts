import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.SEARCH_URL = 'http://localhost:7700';
process.env.PORT = '4000';

// Mock Prisma client
vi.mock('../src/lib/prisma', () => ({
  default: {
    texte: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    article: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    texteRelation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock Meilisearch
vi.mock('../src/lib/meilisearch', () => ({
  initMeiliSearch: vi.fn().mockResolvedValue(undefined),
  indexTexte: vi.fn().mockResolvedValue(undefined),
  removeTexteFromIndex: vi.fn().mockResolvedValue(undefined),
  searchTextes: vi.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0 }),
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  requestLogger: vi.fn((req, res, next) => next()),
}));

// Global test utilities
export const mockDate = (date: Date) => {
  vi.setSystemTime(date);
};

export const resetMocks = () => {
  vi.clearAllMocks();
};
