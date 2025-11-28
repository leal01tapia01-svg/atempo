import React from "react";
import "./modalConfirmacion.css";
import { FaTimes, FaTrash } from "react-icons/fa";

const ModalConfirmacion = ({
  titulo = "Confirmación",
  mensaje = "¿Estás seguro?",
  textoCancelar = "Cancelar",
  textoConfirmar = "Confirmar",
  onCancel,
  onConfirm,
}) => {
  return (
    <>
      <div className="confirm-overlay visible" />
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <button
          className="confirm-cerrar"
          onClick={onCancel}
          aria-label="Cerrar confirmación"
        >
          <FaTimes />
        </button>

        <h3 id="confirm-title" className="confirm-titulo">
          {titulo}
        </h3>
        <p className="confirm-mensaje">{mensaje}</p>

        <div className="confirm-acciones">
          <button className="btn-cancelar" onClick={onCancel}>
            {textoCancelar}
          </button>
          <button className="btn-eliminar" onClick={onConfirm}>
            <FaTrash className="icono-eliminar" />
            {textoConfirmar}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalConfirmacion;
