import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email del cliente inválido')
  .optional()
  .nullable();

const createSchema = z.object({
  titulo: z.string().min(1, 'Título/servicio requerido'),
  empleadoId: z.string(),
  
  clienteNombre: z.string().optional().nullable(),
  celular: z.string().regex(/^\d{10}$/, 'Celular inválido (10 dígitos)').optional().nullable(),
  clienteEmail: emailSchema,
  
  nota: z.string().max(1000).optional().nullable(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .optional()
    .nullable(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),

  tieneRecordatorio: z.boolean().optional(),
  recAnticipacionHoras: z.number().int().min(1).max(72).optional().nullable(),
  recIntervaloMinutos: z.number().int().min(30).optional().nullable(),
  recCantidad: z.number().int().min(1).max(3).optional().nullable(),
});

const updateSchema = createSchema.partial();

function getNegocioId(user) {
  if (user.role === 'EMPLEADO') {
    return user.usuarioId;
  }
  return user.id;
}

function ensureRangeValid(startAt, endAt) {
  if (!(startAt instanceof Date) || !(endAt instanceof Date) || isNaN(startAt) || isNaN(endAt)) {
    const e = new Error('Fechas inválidas');
    e.status = 400;
    throw e;
  }
  if (startAt >= endAt) {
    const e = new Error('La hora de inicio debe ser anterior a la hora de fin.');
    e.status = 400;
    throw e;
  }
}

async function hasOverlap({ usuarioId, empleadoId, startAt, endAt, excludeId }) {
  const where = {
    usuarioId,
    empleadoId, 
    ...(excludeId ? { NOT: { id: excludeId } } : {}),
    startAt: { lt: endAt },
    endAt: { gt: startAt },
  };
  const count = await prisma.cita.count({ where });
  return count > 0;
}

export async function crearCita(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const parsed = createSchema.parse(req.body);

    const startAt = new Date(parsed.startAt);
    const endAt = new Date(parsed.endAt);
    ensureRangeValid(startAt, endAt);

    if (req.user.role === 'EMPLEADO') {
      const yo = await prisma.empleado.findUnique({ 
        where: { id: req.user.id }, select: { permisos: true } 
      });
      if (!yo?.permisos?.citas?.crear) {
         return res.status(403).json({ ok: false, message: 'No tienes permiso para crear citas.' });
      }
    }

    if (parsed.tieneRecordatorio && (!parsed.clienteEmail || !parsed.celular)) {
        return res.status(400).json({ ok: false, message: 'Para activar recordatorios se requiere email y celular.' });
    }

    let finalEmpleadoId = parsed.empleadoId;

    if (finalEmpleadoId === usuarioId) {
        finalEmpleadoId = null;
    } else {
        const empleado = await prisma.empleado.findFirst({
            where: { id: finalEmpleadoId, usuarioId, isActive: true },
        });
        if (!empleado) {
            return res.status(400).json({ ok: false, message: 'Encargado inválido o inactivo.' });
        }
    }

    if (await hasOverlap({ usuarioId, empleadoId: finalEmpleadoId, startAt, endAt })) {
      return res.status(409).json({ ok: false, message: 'El encargado ya tiene una cita en ese horario.' });
    }

    const cita = await prisma.cita.create({
      data: {
        usuarioId,
        empleadoId: finalEmpleadoId,
        titulo: parsed.titulo,
        clienteNombre: parsed.clienteNombre,
        celular: parsed.celular,
        clienteEmail: parsed.clienteEmail || null,
        nota: parsed.nota ?? null,
        color: parsed.color ?? null,
        startAt,
        endAt,
        tieneRecordatorio: parsed.tieneRecordatorio || false,
        recAnticipacionHoras: parsed.recAnticipacionHoras,
        recIntervaloMinutos: parsed.recIntervaloMinutos,
        recCantidad: parsed.recCantidad,
      },
    });

    return res.status(201).json({ ok: true, data: cita });
  } catch (err) {
    next(err);
  }
}

export async function listarCitas(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);

    const citas = await prisma.cita.findMany({
      where: { usuarioId },
      orderBy: { startAt: 'asc' },
      include: {
        empleado: {
          select: { id: true, nombres: true, apellidos: true, fotoUrl: true, isActive: true },
        },
      },
    });

    const dueno = await prisma.usuario.findUnique({ where: { id: usuarioId } });

    const citasMapeadas = citas.map(c => {
        if (!c.empleado && dueno) {
            return {
                ...c,
                empleadoId: dueno.id,
                empleado: {
                    id: dueno.id,
                    nombres: dueno.duenoNombres,
                    apellidos: dueno.duenoApellidos,
                    fotoUrl: dueno.logoUrl,
                    isActive: true
                }
            };
        }
        return c;
    });

    return res.json({ ok: true, data: citasMapeadas });
  } catch (err) {
    next(err);
  }
}

export async function obtenerCita(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;

    const cita = await prisma.cita.findFirst({
      where: { id, usuarioId },
      include: {
        empleado: {
          select: { id: true, nombres: true, apellidos: true, fotoUrl: true, isActive: true },
        },
      },
    });

    if (!cita) return res.status(404).json({ ok: false, message: 'Cita no encontrada.' });

    if (!cita.empleado) {
        const dueno = await prisma.usuario.findUnique({ where: { id: usuarioId } });
        if (dueno) {
            cita.empleadoId = dueno.id;
            cita.empleado = {
                id: dueno.id,
                nombres: dueno.duenoNombres,
                apellidos: dueno.duenoApellidos,
                fotoUrl: dueno.logoUrl,
                isActive: true
            };
        }
    }

    return res.json({ ok: true, data: cita });
  } catch (err) {
    next(err);
  }
}

export async function actualizarCita(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;

    const existente = await prisma.cita.findFirst({ where: { id, usuarioId } });
    if (!existente) return res.status(404).json({ ok: false, message: 'Cita no encontrada.' });

    if (req.user.role === 'EMPLEADO') {
      const yo = await prisma.empleado.findUnique({ 
        where: { id: req.user.id }, select: { permisos: true } 
      });
      if (!yo?.permisos?.citas?.editar) {
         return res.status(403).json({ ok: false, message: 'No tienes permiso para editar citas.' });
      }
    }

    const parsed = updateSchema.parse(req.body);

    const finalEmail = parsed.clienteEmail !== undefined ? parsed.clienteEmail : existente.clienteEmail;
    const finalCelular = parsed.celular !== undefined ? parsed.celular : existente.celular;

    if (parsed.tieneRecordatorio && (!finalEmail || !finalCelular)) {
         return res.status(400).json({ ok: false, message: 'Se requiere email y celular para los recordatorios.' });
    }

    let finalEmpleadoId = undefined;
    if (parsed.empleadoId) {
        if (parsed.empleadoId === usuarioId) {
            finalEmpleadoId = null;
        } else {
            const emp = await prisma.empleado.findFirst({ where: { id: parsed.empleadoId, usuarioId, isActive: true } });
            if (!emp) return res.status(400).json({ ok: false, message: 'Encargado inválido.' });
            finalEmpleadoId = parsed.empleadoId;
        }
    }

    const empleadoIdToCheck = finalEmpleadoId !== undefined ? finalEmpleadoId : existente.empleadoId;
    const startAt = parsed.startAt ? new Date(parsed.startAt) : existente.startAt;
    const endAt = parsed.endAt ? new Date(parsed.endAt) : existente.endAt;
    ensureRangeValid(startAt, endAt);

    if (await hasOverlap({ usuarioId, empleadoId: empleadoIdToCheck, startAt, endAt, excludeId: id })) {
      return res.status(409).json({ ok: false, message: 'El encargado ya tiene una cita en ese horario.' });
    }

    const actualizado = await prisma.cita.update({
      where: { id },
      data: {
        titulo: parsed.titulo ?? undefined,
        clienteNombre: parsed.clienteNombre ?? undefined,
        celular: parsed.celular ?? undefined,
        clienteEmail: parsed.clienteEmail === '' ? null : (parsed.clienteEmail ?? undefined),
        nota: parsed.nota ?? undefined,
        color: parsed.color ?? undefined,
        empleadoId: finalEmpleadoId, 
        startAt,
        endAt,
        tieneRecordatorio: parsed.tieneRecordatorio,
        recAnticipacionHoras: parsed.recAnticipacionHoras,
        recIntervaloMinutos: parsed.recIntervaloMinutos,
        recCantidad: parsed.recCantidad,
      },
    });

    return res.json({ ok: true, data: actualizado });
  } catch (err) {
    next(err);
  }
}

export async function eliminarCita(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;

    const existente = await prisma.cita.findFirst({ where: { id, usuarioId } });
    if (!existente) return res.status(404).json({ ok: false, message: 'Cita no encontrada.' });

    if (req.user.role === 'EMPLEADO') {
      const yo = await prisma.empleado.findUnique({ 
        where: { id: req.user.id }, select: { permisos: true } 
      });
      if (!yo?.permisos?.citas?.eliminar) {
         return res.status(403).json({ ok: false, message: 'No tienes permiso para eliminar citas.' });
      }
    }

    await prisma.cita.delete({ where: { id } });
    return res.json({ ok: true, message: 'Cita eliminada.' });
  } catch (err) {
    next(err);
  }
}

export async function obtenerSugerenciasCliente(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { nombre } = req.query;

    if (!nombre || nombre.trim() === '') return res.status(400).json({ ok: false, message: 'El nombre es obligatorio.' });

    const clientes = await prisma.clienteFrecuente.findMany({
      where: {
        usuarioId,
        nombre: { contains: nombre, mode: 'insensitive' },
      },
      select: { nombre: true, celular: true, correo: true, id: true },
      take: 5,
    });

    const data = clientes.map(c => ({
        clienteNombre: c.nombre,
        celular: c.celular,
        clienteEmail: c.correo,
        id: c.id
    }));

    return res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}