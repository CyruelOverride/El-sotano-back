import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPLOAD_DIR = path.resolve('uploads');

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXT[file.mimetype]),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXT[file.mimetype]) return cb(null, true);
    cb(Object.assign(new Error('Solo se permiten imágenes (jpg, png, webp, gif, avif)'), { status: 400 }));
  },
});
