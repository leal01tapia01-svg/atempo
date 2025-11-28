import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

export async function sendVerificationEmail({ to, code }) {
  await transporter.sendMail({
    from: `"Atempo" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verifica tu correo electrónico',
    text: `Tu código de verificación es: ${code}`,
    html: `
      <p>Hola,</p>
      <p>Tu código de verificación para Atempo es:</p>
      <p style="font-size:18px"><b>${code}</b></p>
      <p>Este código expirará en 15 minutos.</p>
      <p>Si no creaste una cuenta, puedes ignorar este mensaje.</p>
    `,
  });
}

export async function sendTwoFactorEmail({ to, code }) {
  await transporter.sendMail({
    from: `"Atempo" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Tu código de seguridad para iniciar sesión',
    text: `Tu código de seguridad es: ${code}`,
    html: `
      <p>Hola,</p>
      <p>Estás intentando iniciar sesión en Atempo.</p>
      <p>Tu código de seguridad es:</p>
      <p style="font-size: 18px;"><b>${code}</b></p>
      <p>Este código expirará en 10 minutos.</p>
      <p>Si no fuiste tú, puedes ignorar este correo.</p>
    `,
  });
}

export async function sendCitaReminderEmail({ to, cliente, servicio, fecha, hora, negocio }) {
  await transporter.sendMail({
    from: `"Atempo Recordatorios" <${process.env.SMTP_USER}>`,
    to,
    subject: `Recordatorio de cita: ${servicio}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1976d2;">Hola ${cliente},</h2>
        <p>Te recordamos que tienes una cita próxima en <strong>${negocio}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Servicio:</strong> ${servicio}</p>
          <p style="margin: 5px 0;"><strong>Fecha:</strong> ${fecha}</p>
          <p style="margin: 5px 0;"><strong>Hora:</strong> ${hora}</p>
        </div>

        <p>¡Te esperamos!</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <small style="color: #777;">Si deseas reprogramar, por favor contáctanos.</small>
      </div>
    `,
  });
}