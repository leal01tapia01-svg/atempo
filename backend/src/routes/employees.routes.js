import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import { uploadEmpleadoFoto } from '../middlewares/upload.middleware.js';
import { crearEmpleado, listarEmpleados, actualizarEmpleado, desactivarEmpleado, actualizarPermisosEmpleado } from '../controllers/employees.controller.js';

const router = Router();

router.use(authRequired);
router.get('/', listarEmpleados);
router.post('/', uploadEmpleadoFoto, crearEmpleado);
router.put('/:id', uploadEmpleadoFoto, actualizarEmpleado);
router.delete('/:id', desactivarEmpleado);
router.patch('/:id/permisos', actualizarPermisosEmpleado);

export default router;
