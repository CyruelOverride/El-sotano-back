import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload, UPLOAD_DIR } from '../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });
const id = (req) => {
  const n = Number(req.params.id);
  if (!Number.isInteger(n)) throw badRequest('id inválido');
  return n;
};

// Copia solo los campos permitidos y que vengan en el body (permite PATCH parcial).
const pick = (body, fields) =>
  Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const optInt = (v) => (v === null || v === '' ? null : Number.isInteger(Number(v)) ? Number(v) : undefined);
const toBool = (v) => v === true || v === 'true' || v === '1';

const normalizeCategorias = (v) =>
  (Array.isArray(v) ? v : String(v ?? '').split(','))
    .map((c) => String(c).trim())
    .filter(Boolean)
    .join(',');

// ---- Definición de cada recurso ----------------------------------------
const resources = {
  articulos: {
    model: 'articulo',
    include: { imagenes: { orderBy: { orden: 'asc' } } },
    orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
    filters: ['seccion', 'tipo'],
    data(b) {
      const d = pick(b, ['clave', 'seccion', 'tipo', 'titulo', 'subtitulo', 'contenido', 'extra', 'orden', 'activo']);
      if (d.orden !== undefined) d.orden = Number(d.orden);
      if (d.activo !== undefined) d.activo = toBool(d.activo);
      return d;
    },
  },
  alimentos: {
    model: 'alimento',
    include: { imagenes: { orderBy: { orden: 'asc' } } },
    orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
    filters: ['tipo'],
    data(b) {
      const d = pick(b, ['nombre', 'descripcion', 'precio', 'tipo', 'categorias', 'disponible', 'orden']);
      if (d.categorias !== undefined) d.categorias = normalizeCategorias(d.categorias);
      if (d.precio === '') d.precio = null;
      if (d.orden !== undefined) d.orden = Number(d.orden);
      if (d.disponible !== undefined) d.disponible = toBool(d.disponible);
      return d;
    },
  },
  eventos: {
    model: 'evento',
    include: { imagenes: { orderBy: { orden: 'asc' } }, invitados: { select: { id: true, titulo: true } } },
    orderBy: [{ fecha: 'desc' }],
    filters: ['categoria'],
    data(b, mode) {
      const d = pick(b, [
        'slug', 'nombre', 'fecha', 'categoria', 'tipo', 'lugar', 'descripcion',
        'destacado', 'participacion', 'entradas', 'urlEntradas', 'publicado',
      ]);
      if (d.fecha !== undefined) {
        d.fecha = new Date(d.fecha);
        if (Number.isNaN(d.fecha.getTime())) throw badRequest('fecha inválida');
      }
      for (const k of ['destacado', 'participacion', 'publicado']) if (d[k] !== undefined) d[k] = toBool(d[k]);
      if (Array.isArray(b.invitados)) {
        const ids = b.invitados.map((x) => ({ id: Number(x) }));
        d.invitados = mode === 'create' ? { connect: ids } : { set: ids };
      }
      return d;
    },
  },
  imagenes: {
    model: 'imagen',
    orderBy: [{ slot: 'asc' }, { orden: 'asc' }],
    filters: ['slot', 'articuloId', 'eventoId', 'alimentoId'],
    data(b) {
      const d = pick(b, ['url', 'alt', 'slot', 'orden', 'articuloId', 'eventoId', 'alimentoId']);
      if (d.orden !== undefined) d.orden = Number(d.orden);
      for (const k of ['articuloId', 'eventoId', 'alimentoId']) {
        if (d[k] !== undefined) {
          d[k] = optInt(d[k]);
          if (d[k] === undefined) throw badRequest(`${k} inválido`);
        }
      }
      return d;
    },
  },
};

const intFilters = new Set(['articuloId', 'eventoId', 'alimentoId']);

for (const [name, r] of Object.entries(resources)) {
  const m = () => prisma[r.model];

  router.get(`/${name}`, async (req, res) => {
    const where = {};
    for (const f of r.filters) {
      if (req.query[f] !== undefined) where[f] = intFilters.has(f) ? Number(req.query[f]) : req.query[f];
    }
    res.json(await m().findMany({ where, include: r.include, orderBy: r.orderBy }));
  });

  router.get(`/${name}/:id`, async (req, res) => {
    const row = await m().findUnique({ where: { id: id(req) }, include: r.include });
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  });

  // La imagen se crea aparte (subida de archivo), por eso su POST va más abajo.
  if (name !== 'imagenes') {
    router.post(`/${name}`, async (req, res) => {
      const row = await m().create({ data: r.data(req.body ?? {}, 'create'), include: r.include });
      res.status(201).json(row);
    });
  }

  router.put(`/${name}/:id`, async (req, res) => {
    res.json(await m().update({ where: { id: id(req) }, data: r.data(req.body ?? {}, 'update'), include: r.include }));
  });

  if (name !== 'imagenes') {
    router.delete(`/${name}/:id`, async (req, res) => {
      await m().delete({ where: { id: id(req) } });
      res.status(204).end();
    });
  }
}

// ---- Imágenes: subida de archivo o URL externa --------------------------
router.post('/imagenes', upload.single('archivo'), async (req, res) => {
  const d = resources.imagenes.data(req.body ?? {});
  if (req.file) d.url = `/uploads/${req.file.filename}`;
  if (!d.url) throw badRequest('Enviá un archivo (campo "archivo") o una "url"');
  res.status(201).json(await prisma.imagen.create({ data: d }));
});

router.delete('/imagenes/:id', async (req, res) => {
  const img = await prisma.imagen.delete({ where: { id: id(req) } });
  if (img.url.startsWith('/uploads/')) {
    // basename evita salirse de la carpeta de uploads
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(img.url))).catch(() => {});
  }
  res.status(204).end();
});

// ---- Subida de imagen: se guarda como data URL (el disco de Render es efímero) ----
const DATA_URL = /^data:image\/(jpeg|png|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/;
router.post('/upload', (req, res) => {
  const { dataUrl } = req.body ?? {};
  if (typeof dataUrl !== 'string' || !DATA_URL.test(dataUrl)) throw badRequest('Imagen inválida (jpg, png, webp, gif o avif)');
  if (dataUrl.length > 4.5 * 1024 * 1024) throw badRequest('La imagen supera los 3 MB');
  res.status(201).json({ url: dataUrl });
});

// ---- Configuración clave/valor ------------------------------------------
router.get('/configuracion', async (req, res) => {
  res.json(await prisma.configuracion.findMany({ orderBy: { clave: 'asc' } }));
});

router.put('/configuracion/:clave', async (req, res) => {
  if (req.body?.valor === undefined) throw badRequest('Falta "valor"');
  const { clave } = req.params;
  res.json(
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: req.body.valor },
      create: { clave, valor: req.body.valor },
    }),
  );
});

export default router;
