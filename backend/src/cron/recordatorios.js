import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';
import { sendCitaReminderEmail } from '../utils/mailer.js';

const restarHoras = (fecha, horas) => new Date(fecha.getTime() - horas * 60 * 60 * 1000);
const sumarMinutos = (fecha, minutos) => new Date(fecha.getTime() + minutos * 60 * 1000);

export const iniciarCronRecordatorios = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const ahora = new Date();

      const citas = await prisma.cita.findMany({
        where: {
          tieneRecordatorio: true,
          clienteEmail: { not: null },
          startAt: { gt: ahora }, 
        },
        include: {
          usuario: { select: { negocioNombre: true } }
        }
      });

      for (const cita of citas) {
        if (cita.recEnviados >= (cita.recCantidad || 1)) continue;

        const anticipacion = cita.recAnticipacionHoras || 24;
        const intervalo = cita.recIntervaloMinutos || 60;

        const horaInicioEnvios = restarHoras(new Date(cita.startAt), anticipacion);

        if (ahora < horaInicioEnvios) continue;

        let enviarAhora = false;

        if (cita.recEnviados === 0) {
          enviarAhora = true;
        } else {
          if (cita.recUltimoEnvio) {
            const horaSiguienteEnvio = sumarMinutos(new Date(cita.recUltimoEnvio), intervalo);
            if (ahora >= horaSiguienteEnvio) {
              enviarAhora = true;
            }
          }
        }

        if (enviarAhora) {
          console.log(`Enviando recordatorio (${cita.recEnviados + 1}/${cita.recCantidad}) para cita ${cita.id}`);

          const fechaObj = new Date(cita.startAt);
          const fechaStr = fechaObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
          const horaStr = fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

          await sendCitaReminderEmail({
            to: cita.clienteEmail,
            cliente: cita.clienteNombre || 'Cliente',
            servicio: cita.titulo,
            fecha: fechaStr,
            hora: horaStr,
            negocio: cita.usuario.negocioNombre
          });

          await prisma.cita.update({
            where: { id: cita.id },
            data: {
              recEnviados: { increment: 1 },
              recUltimoEnvio: new Date()
            }
          });
        }
      }

    } catch (error) {
      console.error('Error en el cron de recordatorios:', error);
    }
  });
};