# El Sótano · Backend

Express 5 + Prisma + PostgreSQL (Supabase). API: `https://el-sotano-back.onrender.com`

## Variables de entorno
Ver `.env.example`. En Render se cargan en *Environment*:

| Variable | Para qué |
|---|---|
| `BddString` | Conexión Postgres (pooler de Supabase, puerto 6543, con `?pgbouncer=true&connection_limit=5&pool_timeout=30`) |
| `JWT_SECRET` | Firma de los tokens del admin |
| `CORS_ORIGIN` | Dominio(s) del front, separados por coma (ej. `https://tu-front.com,http://localhost:5173`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Solo para `npm run db:admin` |

Render: Build `npm install` · Start `npm start`.

## Base de datos (carpeta `scripts/`)
```
npm run db:schema   # 01_schema.sql  crea tablas y tipos
npm run db:seed     # 02_seed.sql    contenido inicial (idempotente)
npm run db:admin    # crea/actualiza el admin con ADMIN_EMAIL / ADMIN_PASSWORD
npm run db:reset    # 99_reset.sql   ⚠ borra todo
```
Los SQL son equivalentes a `prisma/schema.prisma` (mismos nombres de tabla), así que Prisma funciona sin `migrate`.

## Endpoints
- Público: `GET /health`, `GET /api/content/:section` (home, about, events, restaurant, upcoming, guests, gallery), `GET /api/eventos/:slug`
- Login: `POST /api/auth/login` → `{ token }`
- Admin (Bearer token): `/api/admin/{articulos,alimentos,eventos,imagenes}` (CRUD), `/api/admin/configuracion/:clave`, `POST /api/admin/upload` (imagen → data URL)

## Local
```
npm install
npm run dev
```
