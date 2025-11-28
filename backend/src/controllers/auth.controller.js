import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendTwoFactorEmail } from '../utils/mailer.js';

const phoneRegex = /^[0-9]{10,15}$/;

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const registerSchema = z.object({
  negocioNombre: z.string().min(2, 'El nombre del negocio es obligatorio'),
  duenoNombres: z.string().min(2, 'Nombre(s) del dueño es obligatorio'),
  duenoApellidos: z.string().min(2, 'Apellidos del dueño es obligatorio'),
  celular: z.string().regex(phoneRegex, 'Celular debe tener 10–15 dígitos'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener 6+ caracteres'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

const twoFactorVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

const negocioUpdateSchema = z.object({
  negocioNombre: z.string().min(2, 'El nombre del negocio es obligatorio'),
});

const personalesUpdateSchema = z.object({
  duenoNombres: z.string().min(2, 'Nombre(s) del dueño es obligatorio'),
  duenoApellidos: z.string().min(2, 'Apellidos del dueño es obligatorio'),
  celular: z.string().regex(phoneRegex, 'Celular debe tener 10–15 dígitos'),
  email: z.string().email('Correo inválido'),
});

const passwordChangeSchema = z.object({
  actual: z.string().min(1, 'Contraseña actual requerida'),
  nueva: z.string().min(6, 'La contraseña debe tener 6+ caracteres'),
});

const sanitizeUser = (u) => ({
  id: u.id,
  negocioNombre: u.negocioNombre,
  duenoNombres: u.duenoNombres,
  duenoApellidos: u.duenoApellidos,
  celular: u.celular,
  email: u.email,
  logoUrl: u.logoUrl ?? null,
  plan: u.plan,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
  onboardingCompleted: u.onboardingCompleted ?? false,
});

function publicBase(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

export const register = async (req, res, next) => {
  try {
    const {
      negocioNombre,
      duenoNombres,
      duenoApellidos,
      celular,
      email,
      password,
    } = registerSchema.parse(req.body);

    const [byEmail, byPhone] = await Promise.all([
      prisma.usuario.findUnique({ where: { email } }),
      prisma.usuario.findUnique({ where: { celular } }),
    ]);
    if (byEmail) {
      return res
        .status(409)
        .json({ ok: false, message: 'El correo ya está registrado' });
    }
    if (byPhone) {
      return res
        .status(409)
        .json({ ok: false, message: 'El celular ya está registrado. Debes ingresar con el correo con el que fue vinculado este número' });
    }

    const passwordHash = await hashPassword(password);

    let logoUrl;
    if (req.file) {
      logoUrl = `${publicBase(req)}/uploads/logos/${req.file.filename}`;
    }

    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await prisma.usuario.create({
      data: {
        negocioNombre,
        duenoNombres,
        duenoApellidos,
        celular,
        email,
        passwordHash,
        logoUrl,
        emailVerified: false,
        verificationCode: code,
        verificationExpires: expires,
      },
    });

    await sendVerificationEmail({ to: email, code });

    res.status(201).json({
      ok: true,
      message: 'Te enviamos un código a tu correo para verificarlo.',
      data: { email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.usuario.findUnique({ where: { email } });

    if (user) {
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
      }

      if (!user.emailVerified) {
        return res.status(403).json({ ok: false, message: 'Verifica tu correo primero.' });
      }

      const code = generateVerificationCode();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.usuario.update({
        where: { id: user.id },
        data: { twoFactorCode: code, twoFactorExpires: expires },
      });

      await sendTwoFactorEmail({ to: email, code });

      return res.json({
        ok: true,
        step: '2fa',
        message: 'Código de seguridad enviado.',
        data: { email: user.email },
      });
    }

    const empleado = await prisma.empleado.findFirst({
      where: { email, isActive: true },
      include: { usuario: true }
    });

    if (empleado) {
      const valid = await verifyPassword(password, empleado.passwordHash);
      if (!valid) {
        return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
      }

      const token = signToken({ 
        id: empleado.id, 
        email: empleado.email, 
        role: 'EMPLEADO',
        usuarioId: empleado.usuarioId
      });

      return res.json({
        ok: true,
        step: 'completed',
        message: 'Inicio de sesión exitoso.',
        data: {
          user: {
            id: empleado.id,
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            email: empleado.email,
            fotoUrl: empleado.fotoUrl,
            role: 'EMPLEADO',
            permisos: empleado.permisos,
            negocioNombre: empleado.usuario.negocioNombre,
            logoUrl: empleado.usuario.logoUrl,
          },
          token,
        },
      });
    }

    return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });

  } catch (err) {
    next(err);
  }
};

export const verifyLogin2FA = async (req, res, next) => {
  try {
    const { email, code } = twoFactorVerifySchema.parse(req.body);

    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user || !user.twoFactorCode || !user.twoFactorExpires) {
      return res.status(400).json({ ok: false, message: 'Código inválido' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        ok: false,
        message: 'El correo aún no está verificado.',
      });
    }

    const now = new Date();
    if (user.twoFactorCode !== code || user.twoFactorExpires < now) {
      return res
        .status(400)
        .json({ ok: false, message: 'Código inválido o expirado' });
    }

    const updated = await prisma.usuario.update({
      where: { id: user.id },
      data: {
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    const token = signToken({ id: updated.id, email: updated.email });

    res.json({
      ok: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        user: sanitizeUser(updated),
        token,
        needsOnboarding: !updated.onboardingCompleted,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    if (req.user.role === 'EMPLEADO') {
      const empleado = await prisma.empleado.findUnique({
        where: { id: req.user.id },
        include: { 
          usuario: true
        } 
      });

      if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

      return res.json({
        ok: true,
        data: {
          id: empleado.id,
          duenoNombres: empleado.nombres, 
          duenoApellidos: empleado.apellidos,
          email: empleado.email,
          celular: empleado.celular,
          role: 'EMPLEADO',
          negocioNombre: empleado.usuario.negocioNombre,
          logoUrl: empleado.usuario.logoUrl,
          onboardingCompleted: true,
          permisos: empleado.permisos 
        }
      });
    }

    const user = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    
    return res.json({ 
      ok: true, 
      data: {
        ...sanitizeUser(user),
        role: 'ADMIN'
      }
    });

  } catch (err) {
    next(err);
  }
};

export const completeOnboarding = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updated = await prisma.usuario.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      select: { id: true, onboardingCompleted: true },
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const updateBusiness = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { negocioNombre } = negocioUpdateSchema.parse(req.body);

    const user = await prisma.usuario.update({
      where: { id: userId },
      data: { negocioNombre },
    });

    res.json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const updatePersonal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const { duenoNombres, duenoApellidos, celular, email } = personalesUpdateSchema.parse(req.body);

    if (userRole === 'EMPLEADO') {
      const actualizado = await prisma.empleado.update({
        where: { id: userId },
        data: { 
          nombres: duenoNombres, 
          apellidos: duenoApellidos, 
          celular, 
          email 
        },
      });

      return res.json({ 
        ok: true, 
        data: {
           ...sanitizeUser(actualizado),
           duenoNombres: actualizado.nombres,
           duenoApellidos: actualizado.apellidos
        }
      });
    }

    const [byEmail, byPhone] = await Promise.all([
      prisma.usuario.findFirst({
        where: { email, NOT: { id: userId } },
        select: { id: true },
      }),
      prisma.usuario.findFirst({
        where: { celular, NOT: { id: userId } },
        select: { id: true },
      }),
    ]);

    if (byEmail) return res.status(409).json({ ok: false, message: 'El correo ya está registrado' });
    if (byPhone) return res.status(409).json({ ok: false, message: 'El celular ya está registrado' });

    const user = await prisma.usuario.update({
      where: { id: userId },
      data: { duenoNombres, duenoApellidos, celular, email },
    });

    res.json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { actual, nueva } = passwordChangeSchema.parse(req.body);

    if (userRole === 'EMPLEADO') {
        const empleado = await prisma.empleado.findUnique({ where: { id: userId } });
        if (!empleado) return res.status(404).json({ ok: false, message: 'Empleado no encontrado' });

        const ok = await verifyPassword(actual, empleado.passwordHash);
        if (!ok) return res.status(400).json({ ok: false, message: 'Contraseña actual incorrecta' });

        const passwordHash = await hashPassword(nueva);
        await prisma.empleado.update({ where: { id: userId }, data: { passwordHash } });

        return res.json({ ok: true, message: 'Contraseña actualizada' });
    }

    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });

    const ok = await verifyPassword(actual, user.passwordHash);
    if (!ok) return res.status(400).json({ ok: false, message: 'Contraseña actual incorrecta' });

    const passwordHash = await hashPassword(nueva);
    await prisma.usuario.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    next(err);
  }
};

export const updateLogo = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Archivo de logo requerido' });
    }

    const base = publicBase(req);
    const newUrl = `${base}/uploads/logos/${req.file.filename}`;

    const current = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { logoUrl: true },
    });

    const user = await prisma.usuario.update({
      where: { id: userId },
      data: { logoUrl: newUrl },
    });

    if (current?.logoUrl) {
      const marker = '/uploads/logos/';
      const idx = current.logoUrl.indexOf(marker);
      if (idx !== -1) {
        const filename = current.logoUrl.substring(idx + marker.length);
        const abs = path.join(process.cwd(), 'uploads', 'logos', filename);
        await fs.unlink(abs).catch(() => {});
      }
    }

    res.json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = verifyEmailSchema.parse(req.body);

    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user || !user.verificationCode || !user.verificationExpires) {
      return res.status(400).json({ ok: false, message: 'Código inválido' });
    }

    if (user.emailVerified) {
      const token = signToken({ id: user.id, email: user.email });
      return res.json({
        ok: true,
        message: 'El correo ya estaba verificado',
        data: {
          user: sanitizeUser(user),
          token,
        },
      });
    }

    const now = new Date();
    if (user.verificationCode !== code || user.verificationExpires < now) {
      return res
        .status(400)
        .json({ ok: false, message: 'Código inválido o expirado' });
    }

    const updated = await prisma.usuario.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    const token = signToken({ id: updated.id, email: updated.email });

    res.json({
      ok: true,
      message: 'Correo verificado correctamente',
      data: {
        user: sanitizeUser(updated),
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};
