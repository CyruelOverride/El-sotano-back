-- El Sótano · esquema PostgreSQL (equivale a prisma/schema.prisma, mismos nombres de tabla)
-- Uso: npm run db:schema        (o: psql "$BddString" -f scripts/01_schema.sql)
BEGIN;

CREATE TYPE "Seccion"         AS ENUM ('HOME', 'NOSOTROS', 'RESTO', 'EVENTOS', 'PROXIMAMENTE');
CREATE TYPE "TipoArticulo"    AS ENUM ('TEXTO', 'HISTORIA', 'PILAR', 'INVITADO');
CREATE TYPE "TipoAlimento"    AS ENUM ('COMIDA', 'BEBIDA');
CREATE TYPE "CategoriaEvento" AS ENUM ('LIVE', 'ARCHIVE', 'FOOD');

-- Solo para el login del admin (bcrypt). Se crea con npm run db:admin
CREATE TABLE "Usuario" (
  "id"           SERIAL PRIMARY KEY,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- Texto editable. Los invitados son Articulo con tipo INVITADO.
CREATE TABLE "Articulo" (
  "id"        SERIAL PRIMARY KEY,
  "clave"     TEXT NOT NULL,
  "seccion"   "Seccion" NOT NULL,
  "tipo"      "TipoArticulo" NOT NULL DEFAULT 'TEXTO',
  "titulo"    TEXT NOT NULL DEFAULT '',
  "subtitulo" TEXT,
  "contenido" TEXT NOT NULL DEFAULT '',
  "extra"     JSONB,
  "orden"     INTEGER NOT NULL DEFAULT 0,
  "activo"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Articulo_clave_key" ON "Articulo"("clave");

-- Comida y bebida
CREATE TABLE "Alimento" (
  "id"          SERIAL PRIMARY KEY,
  "nombre"      TEXT NOT NULL,
  "descripcion" TEXT NOT NULL DEFAULT '',
  "precio"      DECIMAL(10,2),
  "tipo"        "TipoAlimento" NOT NULL,
  "categorias"  TEXT NOT NULL DEFAULT '',
  "disponible"  BOOLEAN NOT NULL DEFAULT true,
  "orden"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Eventos pasados y próximos (se distinguen por "fecha")
CREATE TABLE "Evento" (
  "id"            SERIAL PRIMARY KEY,
  "slug"          TEXT NOT NULL,
  "nombre"        TEXT NOT NULL,
  "fecha"         TIMESTAMP(3) NOT NULL,
  "categoria"     "CategoriaEvento" NOT NULL DEFAULT 'LIVE',
  "tipo"          TEXT NOT NULL DEFAULT '',
  "lugar"         TEXT NOT NULL DEFAULT '',
  "descripcion"   TEXT NOT NULL DEFAULT '',
  "destacado"     BOOLEAN NOT NULL DEFAULT false,
  "participacion" BOOLEAN NOT NULL DEFAULT false,
  "entradas"      TEXT,
  "urlEntradas"   TEXT,
  "publicado"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Evento_slug_key" ON "Evento"("slug");
CREATE INDEX "Evento_fecha_idx" ON "Evento"("fecha");

-- Imágenes (url externa o data URL). Cuelgan de articulo/evento/alimento o van sueltas con "slot"
CREATE TABLE "Imagen" (
  "id"         SERIAL PRIMARY KEY,
  "url"        TEXT NOT NULL,
  "alt"        TEXT NOT NULL DEFAULT '',
  "slot"       TEXT,
  "orden"      INTEGER NOT NULL DEFAULT 0,
  "articuloId" INTEGER REFERENCES "Articulo"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "eventoId"   INTEGER REFERENCES "Evento"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
  "alimentoId" INTEGER REFERENCES "Alimento"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Imagen_slot_idx" ON "Imagen"("slot");

-- Datos del sitio: "site", "resto.info", "resto.categorias"
CREATE TABLE "Configuracion" (
  "clave"     TEXT PRIMARY KEY,
  "valor"     JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Relación evento <-> invitados (tabla implícita de Prisma: A = Articulo, B = Evento)
CREATE TABLE "_EventoInvitados" (
  "A" INTEGER NOT NULL REFERENCES "Articulo"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "B" INTEGER NOT NULL REFERENCES "Evento"("id")   ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "_EventoInvitados_AB_unique" ON "_EventoInvitados"("A", "B");
CREATE INDEX "_EventoInvitados_B_index" ON "_EventoInvitados"("B");

COMMIT;
