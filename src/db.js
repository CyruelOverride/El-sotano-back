import { PrismaClient } from '@prisma/client';

// El pooler de Supabase (puerto 6543) corre pgbouncer en modo transacción: Prisma necesita
// pgbouncer=true (sin prepared statements). Se agrega solo si BddString no lo trae.
function datasourceUrl() {
  const raw = process.env.BddString;
  if (!raw) return undefined;
  const url = new URL(raw);
  if (url.port === '6543' || url.hostname.includes('pooler.supabase.com')) {
    if (!url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true');
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '5');
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '30');
  }
  return url.toString();
}

export const prisma = new PrismaClient({ datasourceUrl: datasourceUrl() });
