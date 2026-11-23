import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

// Hash ficticio para igualar el tiempo de respuesta cuando el email no existe.
const DUMMY_HASH = bcrypt.hashSync('dummy', 10);

router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  const user = await prisma.usuario.findUnique({ where: { email: email.toLowerCase().trim() } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
