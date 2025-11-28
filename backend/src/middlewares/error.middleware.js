import { ZodError } from 'zod';

export default (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ ok: false, message: 'El logo supera el tamaño máximo (2MB)' });
  }
  if (err?.message === 'Formato de imagen no permitido') {
    return res.status(400).json({ ok: false, message: err.message });
  }

  if (err instanceof ZodError) {
    const errors =
      Array.isArray(err.issues)
        ? err.issues.map(e => ({
            path: e.path,
            message: e.message,
            code: e.code
          }))
        : [];
    return res.status(400).json({
      ok: false,
      message: 'Datos inválidos',
      errors
    });
  }

  if (err?.code === 'P2002') {
    return res.status(409).json({
      ok: false,
      message: `Campo único duplicado: ${err.meta?.target?.join(', ')}`,
    });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ ok: false, message: 'Registro no encontrado' });
  }

  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return res.status(401).json({ ok: false, message: 'Token inválido o expirado' });
  }

  console.error(err);
  const status = err.status ?? err.statusCode ?? 500;
  return res.status(status).json({
    ok: false,
    message: err.message ?? 'Error interno del servidor',
  });
};
