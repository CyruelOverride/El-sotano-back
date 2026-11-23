import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { UPLOAD_DIR } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import contentRoutes from './routes/content.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // permite <img> desde el frontend
// CORS_ORIGIN: dominios separados por coma. Se tolera que falte el https:// o que sobre la barra final.
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean)
  .map((o) => (/^https?:\/\//.test(o) ? o : `https://${o}`));
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '6mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/uploads', express.static(UPLOAD_DIR, { fallthrough: false }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', contentRoutes);

app.use(notFound);
app.use(errorHandler);
