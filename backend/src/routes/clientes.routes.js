import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
  crearClienteFrecuente,
  obtenerClientesFrecuentes,
  obtenerClienteFrecuente,
  actualizarClienteFrecuente,
  eliminarClienteFrecuente
} from '../controllers/clientes.controller.js';

const router = Router();

router.use(authRequired);

router.get('/', obtenerClientesFrecuentes);
router.post('/', crearClienteFrecuente);
router.get('/:id', obtenerClienteFrecuente);
router.put('/:id', actualizarClienteFrecuente);
router.delete('/:id', eliminarClienteFrecuente);

export default router;