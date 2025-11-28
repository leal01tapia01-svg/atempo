import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import {
  crearCita,
  listarCitas,
  obtenerCita,
  actualizarCita,
  eliminarCita,
  obtenerSugerenciasCliente
} from '../controllers/citas.controller.js';

const router = Router();

router.use(authRequired);

router.get('/', listarCitas);
router.get('/sugerencias', obtenerSugerenciasCliente)
router.get('/:id', obtenerCita);
router.post('/', crearCita);
router.put('/:id', actualizarCita);
router.delete('/:id', eliminarCita);

export default router;
