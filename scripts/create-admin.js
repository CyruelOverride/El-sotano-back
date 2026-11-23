// Crea o actualiza el admin con ADMIN_EMAIL / ADMIN_PASSWORD (bcrypt). Uso: npm run db:admin
import bcrypt from 'bcryptjs';
import pg from 'pg';

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;
const conn = process.env.DirectString || process.env.BddString;
if (!email || !password || !conn) { console.error('Definí ADMIN_EMAIL, ADMIN_PASSWORD y BddString'); process.exit(1); }

const client = new pg.Client({ connectionString: conn.replace(/[?&](pgbouncer|connection_limit)=[^&]*/g, ''), ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(
    `INSERT INTO "Usuario" ("email","passwordHash") VALUES ($1,$2)
     ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`,
    [email, await bcrypt.hash(password, 12)],
  );
  console.log(`Admin listo: ${email}`);
} finally {
  await client.end();
}
