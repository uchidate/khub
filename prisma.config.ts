import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 does not accept connection_limit/pool_timeout as URL parameters.
// Strip query string before passing to datasource — the app uses @prisma/adapter-pg
// with its own pool config; this URL is only used by `prisma migrate deploy`.
function cleanMigrateUrl(raw: string | undefined): string {
  if (!raw) return 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.username}:${u.password}@${u.host}${u.pathname}`;
  } catch {
    return raw.split('?')[0];
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: cleanMigrateUrl(process.env.DATABASE_URL),
  },
});
