-- Contenido inicial (textos de demostración). Idempotente: no pisa lo que el admin ya editó.
-- Uso: npm run db:seed
BEGIN;

INSERT INTO "Articulo" ("clave","seccion","tipo","titulo","contenido","extra","orden") VALUES
 ('home.eslogan','HOME','TEXTO','','Cocina con carácter y ruido bien hecho. Bajá.',NULL,0),
 ('home.resto','HOME','TEXTO','Comer también es hacer ruido','Una cocina sin vueltas, pensada para acompañar la noche. Platos para compartir, bebidas honestas y una mesa siempre cerca del escenario.',NULL,0),
 ('nosotros.quienes','NOSOTROS','TEXTO','Un bar bajo tierra','El Sotano es un bar con restaurante donde la música manda. Un lugar de encuentro para bandas, público y cocina, pensado como un fanzine en tres dimensiones.',NULL,0),
 ('nosotros.historia.1','NOSOTROS','HISTORIA','Un sótano, una idea','Texto de demostración: acá va el relato de cómo empezó el espacio.','{"anio":"Origen"}',1),
 ('nosotros.historia.2','NOSOTROS','HISTORIA','Se suma la cocina','Texto de demostración: acá va la historia de la propuesta gastronómica.','{"anio":"Evolución"}',2),
 ('nosotros.historia.3','NOSOTROS','HISTORIA','Escena y comunidad','Texto de demostración: acá van los hitos que definen al bar hoy.','{"anio":"Hoy"}',3),
 ('nosotros.identidad','NOSOTROS','TEXTO','','Cultura underground, volumen alto y puertas abiertas. Acá se mezclan los géneros, las generaciones y las ganas de que pase algo.',NULL,0),
 ('nosotros.pilar.1','NOSOTROS','PILAR','Música en vivo','',NULL,1),
 ('nosotros.pilar.2','NOSOTROS','PILAR','Cocina de autor','',NULL,2),
 ('nosotros.pilar.3','NOSOTROS','PILAR','Comunidad','',NULL,3),
 ('nosotros.pilar.4','NOSOTROS','PILAR','Irreverencia','',NULL,4),
 ('resto.intro','RESTO','TEXTO','Resto','Cocina de sótano: intensa, generosa y sin solemnidad.',NULL,0),
 ('resto.propuesta','RESTO','TEXTO','Nuestra propuesta','Texto de demostración: acá se describe la cocina, las especialidades y la forma de comer en El Sótano.',NULL,0)
ON CONFLICT ("clave") DO NOTHING;

INSERT INTO "Configuracion" ("clave","valor") VALUES
 ('site', '{"name":"El Sotano","address":"Dirección a confirmar","email":"contacto@elsotano.example","phone":"","hours":[{"days":"Jueves a sábado","time":"20:00 — 03:00"},{"days":"Domingo","time":"12:00 — 17:00"}],"social":[{"label":"Instagram","url":"#"},{"label":"Facebook","url":"#"},{"label":"YouTube","url":"#"}]}'),
 ('resto.info', '{"reservations":"Reservas: a confirmar.","note":""}')
ON CONFLICT ("clave") DO NOTHING;

COMMIT;
