import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/avisoDePrivacidad.css";
import logo from '../assets/LogoAtempoPNG.png';

const AvisoPrivacidad = () => {
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate(-1);
  };

  return (
    <div className="aviso-wrapper">
      <div className="aviso-card">
        <div className="aviso-content">
          <img src={logo} alt="Atempo Logo" className="aviso-logo" />
          <h1 className="aviso-title">Aviso de Privacidad</h1>
          <p className="aviso-fecha">
            Fecha de última actualización: 6 de agosto de 2025
          </p>

          <p>
            En cumplimiento con lo establecido por la Ley Federal de Protección
            de Datos Personales en Posesión de los Particulares y demás
            disposiciones aplicables en la materia, se emite el presente aviso
            de privacidad para los usuarios del sistema SaaS de gestión de citas
            para negocios, en adelante "el sistema".
          </p>

          <h2>1. Responsable del tratamiento de datos personales</h2>
          <p>
            El responsable del tratamiento de los datos personales es el equipo
            desarrollador de Atempo, sistema SaaS de gestión de citas para
            negocios, cuya finalidad es ofrecer una herramienta digital
            exclusiva para dueños de negocios que deseen gestionar su agenda,
            citas, empleados y clientes de forma eficiente.
          </p>
          <p>
            Para cualquier duda, aclaración o ejercicio de derechos relacionados
            con sus datos personales, puede contactarse al siguiente correo
            electrónico:
          </p>
          <p>✉️ privacidad@atempo.com</p>

          <h2>2. Datos personales que se recopilan</h2>
          <ul>
            <li>Nombre completo del usuario (dueño del negocio)</li>
            <li>Correo electrónico del usuario</li>
            <li>Número telefónico</li>
            <li>Nombre del negocio</li>
            <li>
              Datos de clientes frecuentes: nombre, teléfono y correo
              electrónico
            </li>
            <li>
              Datos de empleados: nombre, correo, teléfono y avatar (imagen)
            </li>
            <li>
              Información de citas programadas: fecha, hora, servicio,
              encargado, cliente y observaciones
            </li>
          </ul>

          <h2>3. Finalidades del tratamiento de datos</h2>
          <ul>
            <li>Permitir el acceso y uso seguro del sistema</li>
            <li>Gestionar la agenda y citas del negocio</li>
            <li>Personalizar la experiencia con el nombre del negocio</li>
            <li>Administrar empleados y clientes frecuentes</li>
            <li>
              Generar reportes y estadísticas internas para mejorar el servicio
            </li>
            <li>
              En ningún caso se utilizarán los datos con fines distintos a los
              descritos
            </li>
          </ul>

          <h2>4. Acceso y control de la información</h2>
          <p>
            El sistema está diseñado para ser utilizado exclusivamente por el
            dueño del negocio que creó la cuenta. No se han implementado roles
            ni distintos niveles de acceso.
          </p>
          <p>
            No se comparten, venden ni transfieren datos personales a terceros
            sin el consentimiento expreso del usuario.
          </p>

          <h2>5. Medidas de seguridad</h2>
          <p>
            Se implementan medidas técnicas, administrativas y organizativas
            razonables para proteger los datos personales contra pérdida, uso
            indebido, acceso no autorizado, alteración o divulgación.
          </p>

          <h2>6. Derechos ARCO</h2>
          <p>
            El usuario tiene derecho a acceder, rectificar, cancelar u oponerse
            al tratamiento de sus datos personales.
          </p>
          <p>
            Para ejercer estos derechos, el usuario deberá enviar su solicitud
            al correo: ✉️ privacidad@atempo.com
          </p>

          <h2>7. Cambios en el aviso de privacidad</h2>
          <p>
            Este aviso puede ser modificado en cualquier momento para adaptarse
            a cambios legales, operativos o de servicios.
          </p>
          <p>
            Cualquier modificación será publicada dentro de Atempo con la fecha
            actualizada y, en caso necesario, se notificará al correo
            electrónico registrado.
          </p>

          <h2>8. Uso de cookies y tecnologías de rastreo</h2>
          <p>
            Actualmente, el sistema no utiliza cookies ni tecnologías de
            rastreo. En caso de implementar alguna de estas herramientas en el
            futuro, se notificará previamente al usuario para obtener su
            consentimiento.
          </p>
        </div>

        <button className="aviso-btn" onClick={handleAccept}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default AvisoPrivacidad;
