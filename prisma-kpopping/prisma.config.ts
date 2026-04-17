import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma-kpopping/schema.prisma',
  migrations: {
    path: 'prisma-kpopping/migrations',
  },
  datasource: {
    url: process.env.KPOPPING_DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/kpopping_placeholder',
  },
});
