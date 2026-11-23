import { Router } from 'express';
import { SECTIONS, getSection, getEventoBySlug } from '../services/content.js';

const router = Router();

// El frontend espera `{ data }` (ver contentService.js).
router.get('/content/:section', async (req, res) => {
  if (!SECTIONS.includes(req.params.section)) return res.status(404).json({ error: 'Sección desconocida' });
  res.json({ data: await getSection(req.params.section) });
});

router.get('/eventos/:slug', async (req, res) => {
  const data = await getEventoBySlug(req.params.slug);
  if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ data });
});

export default router;
