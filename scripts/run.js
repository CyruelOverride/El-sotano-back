// Ejecuta un archivo .sql de esta carpeta contra la base (BddString).
// Uso: node --env-file=.env scripts/run.js 01_schema.sql
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const file = process.argv[2];
if (!file) { console.error('Uso: node scripts/run.js <archivo.sql>'); process.exit(1); }
// DirectString (puerto 5432) es opcional; el pooler (6543) también acepta DDL.
const conn = process.env.DirectString || process.env.BddString;
if (!conn) { console.error('Falta BddString en .env'); process.exit(1); }

const sql = fs.readFileSync(path.resolve(import.meta.dirname, file), 'utf8');
const client = new pg.Client({ connectionString: conn.replace(/[?&](pgbouncer|connection_limit)=[^&]*/g, ''), ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log(`OK: ${file}`);
} catch (e) {
  console.error(`ERROR en ${file}: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
