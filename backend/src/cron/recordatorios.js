import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';
import { sendCitaReminderEmail, sendCitaReminderEmpleadoEmail } from '../utils/mailer.js';

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
          usuario: {
            select: {
              negocioNombre: true,
              email: true,
              duenoNombres: true,
              duenoApellidos: true,
            },
          },
          empleado: {
            select: {
              email: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
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
          const fechaStr = fechaObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });
          const horaStr = fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });

          await sendCitaReminderEmail({
            to: cita.clienteEmail,
            cliente: cita.clienteNombre || 'Cliente',
            servicio: cita.titulo,
            fecha: fechaStr,
            hora: horaStr,
            negocio: cita.usuario.negocioNombre
          });

          let empleadoEmail = null;
          let empleadoNombre = null;

          if (cita.empleado && cita.empleado.email) {
            // Cita asignada a un empleado específico
            empleadoEmail = cita.empleado.email;
            empleadoNombre = `${cita.empleado.nombres || ''} ${cita.empleado.apellidos || ''}`.trim() || 'Encargado';
          } else if (cita.usuario && cita.usuario.email) {
            // Cita sin empleado -> se manda al dueño del negocio
            empleadoEmail = cita.usuario.email;
            empleadoNombre =
              `${cita.usuario.duenoNombres || ''} ${cita.usuario.duenoApellidos || ''}`.trim() ||
              'Encargado';
          }

          if (empleadoEmail) {
            await sendCitaReminderEmpleadoEmail({
              to: empleadoEmail,
              empleado: empleadoNombre,
              servicio: cita.titulo,
              fecha: fechaStr,
              hora: horaStr,
              cliente: cita.clienteNombre || 'Cliente',
              negocio: cita.usuario.negocioNombre,
            });
          }

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