// Arma, desde las entidades, las mismas formas que hoy devuelve fallbackData.js
// para que el frontend no cambie.
import { prisma } from '../db.js';

export const SECTIONS = ['home', 'about', 'events', 'restaurant', 'upcoming', 'guests', 'gallery'];

const img = (i) => (i ? i.url : null);
const asImg = (i) => ({ src: i.url, alt: i.alt });
const day = (d) => d.toISOString().slice(0, 10);
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function articulos(where) {
  return prisma.articulo.findMany({
    where: { activo: true, ...where },
    orderBy: { orden: 'asc' },
    include: { imagenes: { orderBy: { orden: 'asc' } } },
  });
}
const byClave = (list, clave) => list.find((a) => a.clave === clave);

async function slotImages(slot) {
  return prisma.imagen.findMany({ where: { slot }, orderBy: { orden: 'asc' } });
}
async function config(clave) {
  return (await prisma.configuracion.findUnique({ where: { clave } }))?.valor ?? null;
}

const eventoInclude = {
  imagenes: { orderBy: { orden: 'asc' } },
  invitados: { where: { activo: true }, select: { titulo: true } },
};

const builders = {
  async home() {
    const [arts, hero, resto, site] = await Promise.all([
      articulos({ seccion: 'HOME' }),
      slotImages('home.hero'),
      slotImages('home.resto'),
      config('site'),
    ]);
    const tagline = byClave(arts, 'home.eslogan');
    const r = byClave(arts, 'home.resto');
    return {
      site: site ?? {},
      hero: { image: img(hero[0]), tagline: tagline?.contenido ?? '' },
      restaurant: { title: r?.titulo ?? '', text: r?.contenido ?? '', image: img(resto[0]) },
    };
  },

  async about() {
    const [arts, space] = await Promise.all([articulos({ seccion: 'NOSOTROS' }), slotImages('about.space')]);
    const who = byClave(arts, 'nosotros.quienes');
    const identity = byClave(arts, 'nosotros.identidad');
    return {
      who: { title: who?.titulo ?? '', text: who?.contenido ?? '' },
      history: arts
        .filter((a) => a.tipo === 'HISTORIA')
        .map((a) => ({ year: a.extra?.anio ?? '', title: a.titulo, text: a.contenido })),
      identity: {
        text: identity?.contenido ?? '',
        pillars: arts.filter((a) => a.tipo === 'PILAR').map((a) => a.titulo),
      },
      space: space.map(asImg),
    };
  },

  async guests() {
    const rows = await prisma.articulo.findMany({
      where: { activo: true, tipo: 'INVITADO' },
      orderBy: { orden: 'asc' },
      include: {
        imagenes: { orderBy: { orden: 'asc' }, take: 1 },
        eventos: { where: { publicado: true }, orderBy: { fecha: 'desc' }, take: 1, select: { id: true } },
      },
    });
    return {
      items: rows.map((a) => ({
        id: String(a.id),
        name: a.titulo,
        category: a.subtitulo ?? '',
        description: a.contenido,
        image: img(a.imagenes[0]),
        eventId: a.eventos[0] ? String(a.eventos[0].id) : null,
      })),
    };
  },

  // Eventos pasados (el archivo). Los próximos van en `upcoming`.
  async events() {
    const rows = await prisma.evento.findMany({
      where: { publicado: true, fecha: { lt: new Date() } },
      orderBy: { fecha: 'desc' },
      include: eventoInclude,
    });
    return {
      items: rows.map((e) => ({
        id: String(e.id),
        slug: e.slug,
        name: e.nombre,
        date: day(e.fecha),
        category: e.categoria,
        type: e.tipo,
        location: e.lugar,
        description: e.descripcion,
        image: img(e.imagenes[0]),
        images: e.imagenes.map((i) => i.url),
        guests: e.invitados.map((g) => g.titulo),
        featured: e.destacado,
        participation: e.participacion,
      })),
    };
  },

  async upcoming() {
    const rows = await prisma.evento.findMany({
      where: { publicado: true, fecha: { gte: new Date() } },
      orderBy: { fecha: 'asc' },
      include: eventoInclude,
    });
    return {
      items: rows.map((e) => ({
        id: String(e.id),
        slug: e.slug,
        name: e.nombre,
        date: day(e.fecha),
        description: e.descripcion,
        image: img(e.imagenes[0]),
        guests: e.invitados.map((g) => g.titulo),
        tickets: e.entradas ?? '',
        url: e.urlEntradas ?? '',
        category: 'UPCOMING',
      })),
    };
  },

  async restaurant() {
    const [arts, alimentos, gallery, space, info] = await Promise.all([
      articulos({ seccion: 'RESTO' }),
      prisma.alimento.findMany({
        where: { disponible: true },
        orderBy: [{ orden: 'asc' }, { id: 'asc' }],
        include: { imagenes: { orderBy: { orden: 'asc' }, take: 1 } },
      }),
      slotImages('resto.gallery'),
      slotImages('resto.space'),
      config('resto.info'),
    ]);
    const intro = byClave(arts, 'resto.intro');
    const proposal = byClave(arts, 'resto.propuesta');

    // Categorías: unión de los varchar separados por coma, en orden de aparición.
    const cats = new Map();
    const dishes = alimentos.map((a) => {
      const names = a.categorias.split(',').map((c) => c.trim()).filter(Boolean);
      if (!names.length) names.push(a.tipo === 'BEBIDA' ? 'Bebidas' : 'Comidas');
      const ids = names.map((n) => {
        const cid = slug(n);
        if (!cats.has(cid)) cats.set(cid, n);
        return cid;
      });
      return {
        id: String(a.id),
        categoryId: ids[0], // el frontend agrupa por una sola categoría
        categoryIds: ids,
        type: a.tipo, // COMIDA | BEBIDA
        name: a.nombre,
        description: a.descripcion,
        price: a.precio == null ? null : Number(a.precio),
        image: img(a.imagenes[0]),
      };
    });

    return {
      intro: { title: intro?.titulo ?? '', text: intro?.contenido ?? '' },
      proposal: { title: proposal?.titulo ?? '', text: proposal?.contenido ?? '' },
      categories: [...cats].map(([cid, name]) => ({ id: cid, name })),
      dishes,
      gallery: gallery.map(asImg),
      space: space.map(asImg),
      info: info ?? { reservations: '', note: '' },
    };
  },

  async gallery() {
    return { items: (await slotImages('gallery')).map(asImg) };
  },
};

export async function getSection(section) {
  const build = builders[section];
  return build ? build() : null;
}

export async function getEventoBySlug(slugValue) {
  const e = await prisma.evento.findFirst({
    where: { slug: slugValue, publicado: true },
    include: eventoInclude,
  });
  if (!e) return null;
  return {
    id: String(e.id),
    slug: e.slug,
    name: e.nombre,
    date: day(e.fecha),
    category: e.categoria,
    type: e.tipo,
    location: e.lugar,
    description: e.descripcion,
    image: img(e.imagenes[0]),
    images: e.imagenes.map((i) => i.url),
    guests: e.invitados.map((g) => g.titulo),
    featured: e.destacado,
    participation: e.participacion,
    tickets: e.entradas ?? '',
    url: e.urlEntradas ?? '',
    upcoming: e.fecha >= new Date(),
  };
}
