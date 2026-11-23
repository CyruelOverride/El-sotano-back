-- ⚠ BORRA TODO (tablas y tipos). Uso: npm run db:reset
BEGIN;
DROP TABLE IF EXISTS "_EventoInvitados", "Imagen", "Evento", "Alimento", "Articulo", "Configuracion", "Usuario" CASCADE;
DROP TYPE IF EXISTS "Seccion", "TipoArticulo", "TipoAlimento", "CategoriaEvento";
COMMIT;
