import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

function getNegocioId(user) {
  if (user.role === 'EMPLEADO') {
    return user.usuarioId;
  }
  return user.id;
}

const createSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  correo: z.string().email('El correo electrónico no es válido').min(1, 'El correo es obligatorio'),
  celular: z.string().min(10, 'El celular debe tener al menos 10 dígitos').max(15, 'El celular no puede tener más de 15 dígitos'),
});

const updateSchema = createSchema.partial();

export async function crearClienteFrecuente(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const parsed = createSchema.parse(req.body);

    const clienteExistente = await prisma.clienteFrecuente.findFirst({
      where: { 
        usuarioId,
        correo: parsed.correo 
      },
    });

    if (clienteExistente) {
      return res.status(400).json({ ok: false, message: 'El cliente ya existe en tu negocio.' });
    }

    const cliente = await prisma.clienteFrecuente.create({
      data: {
        ...parsed,
        usuarioId,
      },
    });

    return res.status(201).json({ ok: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function obtenerClientesFrecuentes(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);

    const clientes = await prisma.clienteFrecuente.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json({ ok: true, data: clientes });
  } catch (err) {
    next(err);
  }
}

export async function obtenerClienteFrecuente(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;

    const cliente = await prisma.clienteFrecuente.findFirst({ 
      where: { id, usuarioId } 
    });

    if (!cliente) {
      return res.status(404).json({ ok: false, message: 'Cliente no encontrado.' });
    }

    return res.json({ ok: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function actualizarClienteFrecuente(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;
    const parsed = updateSchema.parse(req.body);

    const existe = await prisma.clienteFrecuente.findFirst({ where: { id, usuarioId } });
    if (!existe) return res.status(404).json({ message: 'Cliente no encontrado' });

    const cliente = await prisma.clienteFrecuente.update({
      where: { id },
      data: parsed,
    });

    return res.json({ ok: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function eliminarClienteFrecuente(req, res, next) {
  try {
    const usuarioId = getNegocioId(req.user);
    const { id } = req.params;

    const existe = await prisma.clienteFrecuente.findFirst({ where: { id, usuarioId } });
    if (!existe) return res.status(404).json({ message: 'Cliente no encontrado' });

    await prisma.clienteFrecuente.delete({ where: { id } });

    return res.json({ ok: true, message: 'Cliente eliminado.' });
  } catch (err) {
    next(err);
  }
}