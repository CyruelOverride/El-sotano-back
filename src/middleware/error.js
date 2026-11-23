export function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.code === 'P2025') return res.status(404).json({ error: 'No encontrado' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
  if (err.code === 'P2003') return res.status(400).json({ error: 'Referencia inválida' });
  if (err.name === 'MulterError' || err.status) {
    return res.status(err.status || 400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
}
