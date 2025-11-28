import { verifyToken } from '../utils/jwt.js';

export const authRequired = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Falta token de autorización' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};
