import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../utils/hash.js';

function getNegocioId(user) {
  if (user.role === 'EMPLEADO') {
    return user.usuarioId;
  }
  return user.id;
}

const empleadoSchema = z.object({
  nombres: z.string().min(1, 'Nombres requeridos'),
  apellidos: z.string().min(1, 'Apellidos requeridos'),
  celular: z.string().min(8, 'Celular inválido'),
  email: z.string().email('Email inválido'),
});

const empleadoUpdateSchema = z.object({
  nombres: z.string().min(1, 'Nombres requeridos').optional(),
  apellidos: z.string().min(1, 'Apellidos requeridos').optional(),
  celular: z.string().min(8, 'Celular inválido').optional(),
  email: z.string().email('Email inválido').optional(),
});

const permisosSchema = z.object({
  citas: z.object({
    crear: z.boolean(),
    editar: z.boolean(),
    eliminar: z.boolean(),
  }),
  empleados: z.object({
    crear: z.boolean(),
    editar: z.boolean(),
    eliminar: z.boolean(),
  }),
  clientes: z.object({
    crear: z.boolean(),
    editar: z.boolean(),
    eliminar: z.boolean(),
  }),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMPLEADOS_DIR = path.join(__dirname, '..', '..', 'uploads', 'empleados');

function deleteFileIfExists(absPath) {
  try {
    if (absPath && fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch {
  }
}

export async function crearEmpleado(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);

    if (req.user.role === 'EMPLEADO') {
      const yo = await prisma.empleado.findUnique({ 
        where: { id: req.user.id },
        select: { permisos: true }
      });
      if (!yo?.permisos?.empleados?.crear) {
         return res.status(403).json({ ok: false, message: 'No tienes permiso para registrar empleados.' });
      }
    }

    const { nombres, apellidos, celular, email } = empleadoSchema.parse(req.body);

    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    let fotoUrl;
    if (req.file?.filename) {
      fotoUrl = `${base}/uploads/empleados/${req.file.filename}`;
    } else {
      fotoUrl = `${base}/uploads/empleados/avatar.png`;
    }

    const defaultPassword = "empleado";
    const passwordHash = await hashPassword(defaultPassword);

    const empleado = await prisma.empleado.create({
      data: { 
        nombres, 
        apellidos, 
        celular, 
        email, 
        fotoUrl, 
        usuarioId,
        passwordHash,
        permisos: {
            citas: { crear: false, editar: false, eliminar: false },
            empleados: { crear: false, editar: false, eliminar: false },
            clientes: { crear: false, editar: false, eliminar: false }
        }
      },
    });

    return res.status(201).json({ ok: true, data: empleado });
  } catch (err) {
    next(err);
  }
}

export async function listarEmpleados(req, res, next) {
  try {
    const idDelNegocio = req.user.role === 'EMPLEADO' 
      ? req.user.usuarioId 
      : req.user.id;

    const incluirInactivos = req.query.inactivos === '1';
    const forAgenda = req.query.forAgenda === 'true';

    const empleados = await prisma.empleado.findMany({
      where: {
        usuarioId: idDelNegocio,
        ...(incluirInactivos ? {} : { isActive: true }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (forAgenda) {
      const dueno = await prisma.usuario.findUnique({
        where: { id: idDelNegocio },
        select: { 
          id: true, 
          duenoNombres: true, 
          duenoApellidos: true, 
          logoUrl: true, 
          email: true, 
          celular: true 
        }
      });

      if (dueno) {
        const ownerAsEmployee = {
          id: dueno.id, 
          nombres: dueno.duenoNombres,
          apellidos: dueno.duenoApellidos,
          celular: dueno.celular,
          email: dueno.email,
          fotoUrl: dueno.logoUrl,
          usuarioId: dueno.id,
          isActive: true,
          isOwner: true
        };

        empleados.unshift(ownerAsEmployee);
      }
    }

    res.json({ ok: true, data: empleados });
  } catch (err) {
    next(err);
  }
}

export async function actualizarEmpleado(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;

    if (req.user.role === 'EMPLEADO') {
      const yo = await prisma.empleado.findUnique({ 
        where: { id: req.user.id },
        select: { permisos: true }
      });
      if (!yo?.permisos?.empleados?.editar) {
         return res.status(403).json({ ok: false, message: 'No tienes permiso para editar empleados.' });
      }
    }

    const payload = empleadoUpdateSchema.parse(req.body);
    const traeFotoNueva = !!req.file?.filename;

    if (!traeFotoNueva && Object.keys(payload).length === 0) {
      return res.status(400).json({ ok: false, message: 'No hay cambios para actualizar.' });
    }

    const existente = await prisma.empleado.findFirst({
      where: { id, usuarioId },
    });
    if (!existente) {
      return res.status(404).json({ ok: false, message: 'Empleado no encontrado.' });
    }

    let nuevaFotoUrl;
    if (traeFotoNueva) {
      const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
      nuevaFotoUrl = `${base}/uploads/empleados/${req.file.filename}`;
    }

    const actualizado = await prisma.empleado.update({
      where: { id },
      data: {
        ...payload,
        ...(traeFotoNueva ? { fotoUrl: nuevaFotoUrl } : {}),
      },
    });

    if (traeFotoNueva && existente.fotoUrl) {
      const oldRel = existente.fotoUrl.split('/uploads/empleados/')[1];
      if (oldRel) {
        if (oldRel !== 'avatar.png') {
            const oldAbs = path.join(EMPLEADOS_DIR, oldRel);
            deleteFileIfExists(oldAbs);
        }
      }
    }

    return res.json({ ok: true, data: actualizado });
  } catch (err) {
    next(err);
  }
}

export async function desactivarEmpleado(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;

    if (req.user.role === 'EMPLEADO') {
      const yo = await prisma.empleado.findUnique({ 
        where: { id: req.user.id },
        select: { permisos: true }
      });
      if (!yo?.permisos?.empleados?.eliminar) {
         return res.status(403).json({ ok: false, message: 'No tienes permiso para eliminar empleados.' });
      }
      if (id === req.user.id) {
        return res.status(400).json({ ok: false, message: "No puedes elimintarte a ti mismo." });
      }
    }

    const emp = await prisma.empleado.findFirst({ where: { id, usuarioId } });
    if (!emp) return res.status(404).json({ ok: false, message: 'Empleado no encontrado.' });

    const updated = await prisma.empleado.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
      select: { id: true, isActive: true, deletedAt: true },
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function actualizarPermisosEmpleado(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);

    const { id } = req.params;

    const permisosData = permisosSchema.parse(req.body);
    const empleado = await prisma.empleado.findFirst({
      where: { id, usuarioId },
    });

    if (!empleado) {
      return res.status(404).json({ ok: false, message: 'Empleado no encontrado.' });
    }

    const actualizado = await prisma.empleado.update({
      where: { id },
      data: {
        permisos: permisosData,
      },
    });

    return res.json({ ok: true, message: 'Permisos actualizados', data: actualizado });
  } catch (err) {
    next(err);
  }
}