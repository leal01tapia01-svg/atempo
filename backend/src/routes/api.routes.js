import { Router } from 'express';
import authRoutes from './auth.routes.js';
import empleadosRoutes from './employees.routes.js';
import citasRoutes from './citas.routes.js';
import clientesFrecuentesRoutes from './clientes.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true, status: 'healthy' }));
router.use('/auth', authRoutes);
router.use('/empleados', empleadosRoutes);
router.use('/citas', citasRoutes);
router.use('/clientes-frecuentes', clientesFrecuentesRoutes);

export default router;
