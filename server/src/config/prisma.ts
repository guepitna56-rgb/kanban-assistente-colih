import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Ativar chaves estrangeiras explicitamente no SQLite
prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;')
  .catch((err) => console.error('Erro ao habilitar foreign keys no SQLite:', err));
