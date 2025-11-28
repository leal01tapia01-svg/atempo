export default (req, res, next) => {
  res.status(404).json({
    ok: false,
    message: `No se encontró la ruta: ${req.method} ${req.originalUrl}`,
  });
};
