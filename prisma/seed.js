// Crea el admin y el contenido inicial (los textos de demostración del frontend).
// Es idempotente: se puede correr varias veces sin duplicar ni pisar ediciones.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const articulos = [
  { clave: 'home.eslogan', seccion: 'HOME', contenido: 'Cocina con carácter y ruido bien hecho. Bajá.' },
  { clave: 'home.resto', seccion: 'HOME', titulo: 'Comer también es hacer ruido', contenido: 'Una cocina sin vueltas, pensada para acompañar la noche. Platos para compartir, bebidas honestas y una mesa siempre cerca del escenario.' },
  { clave: 'nosotros.quienes', seccion: 'NOSOTROS', titulo: 'Un bar bajo tierra', contenido: 'El Sotano es un bar con restaurante donde la música manda. Un lugar de encuentro para bandas, público y cocina, pensado como un fanzine en tres dimensiones.' },
  { clave: 'nosotros.historia.1', seccion: 'NOSOTROS', tipo: 'HISTORIA', orden: 1, titulo: 'Un sótano, una idea', contenido: 'Texto de demostración: acá va el relato de cómo empezó el espacio.', extra: { anio: 'Origen' } },
  { clave: 'nosotros.historia.2', seccion: 'NOSOTROS', tipo: 'HISTORIA', orden: 2, titulo: 'Se suma la cocina', contenido: 'Texto de demostración: acá va la historia de la propuesta gastronómica.', extra: { anio: 'Evolución' } },
  { clave: 'nosotros.historia.3', seccion: 'NOSOTROS', tipo: 'HISTORIA', orden: 3, titulo: 'Escena y comunidad', contenido: 'Texto de demostración: acá van los hitos que definen al bar hoy.', extra: { anio: 'Hoy' } },
  { clave: 'nosotros.identidad', seccion: 'NOSOTROS', contenido: 'Cultura underground, volumen alto y puertas abiertas. Acá se mezclan los géneros, las generaciones y las ganas de que pase algo.' },
  ...['Música en vivo', 'Cocina de autor', 'Comunidad', 'Irreverencia'].map((titulo, i) => ({
    clave: `nosotros.pilar.${i + 1}`, seccion: 'NOSOTROS', tipo: 'PILAR', orden: i + 1, titulo,
  })),
  { clave: 'resto.intro', seccion: 'RESTO', titulo: 'Resto', contenido: 'Cocina de sótano: intensa, generosa y sin solemnidad.' },
  { clave: 'resto.propuesta', seccion: 'RESTO', titulo: 'Nuestra propuesta', contenido: 'Texto de demostración: acá se describe la cocina, las especialidades y la forma de comer en El Sótano.' },
];

const configuraciones = {
  site: {
    name: 'El Sotano',
    address: 'Dirección a confirmar',
    email: 'contacto@elsotano.example',
    phone: '',
    hours: [
      { days: 'Jueves a sábado', time: '20:00 — 03:00' },
      { days: 'Domingo', time: '12:00 — 17:00' },
    ],
    social: [
      { label: 'Instagram', url: '#' },
      { label: 'Facebook', url: '#' },
      { label: 'YouTube', url: '#' },
    ],
  },
  'resto.info': { reservations: 'Reservas: a confirmar.', note: '' },
};

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Definí ADMIN_EMAIL y ADMIN_PASSWORD en .env');

  await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 12) },
    create: { email, passwordHash: await bcrypt.hash(password, 12) },
  });

  // update vacío: no pisa lo que el admin ya editó.
  for (const a of articulos) {
    await prisma.articulo.upsert({ where: { clave: a.clave }, update: {}, create: a });
  }
  for (const [clave, valor] of Object.entries(configuraciones)) {
    await prisma.configuracion.upsert({ where: { clave }, update: {}, create: { clave, valor } });
  }
  console.log(`Seed listo. Admin: ${email}`);
}

main().finally(() => prisma.$disconnect());
