import React, { useEffect, useRef, useState } from 'react';
import './modalNuevoEmpleado.css';
import { FaTimes, FaUpload, FaSave } from 'react-icons/fa';
import avatar from '../../assets/avatar.png';

const ALLOWED_MIMES = ['image/png','image/jpeg','image/jpg','image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ModalNuevoEmpleado = ({ modo = 'crear', empleado, onClose, onSaved }) => {
  const [form, setForm] = useState({
    id: undefined,
    nombre: '',
    apellidos: '',
    email: '',
    celular: '',
  });

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (modo === 'editar' && empleado) {
      setForm({
        id: empleado.id,
        nombre: empleado.nombres || '',
        apellidos: empleado.apellidos || '',
        email: empleado.email || '',
        celular: empleado.celular || '',
      });
      setFotoPreview(empleado.fotoUrl || null);
      setFotoFile(null);
    } else {
      setForm({ id: undefined, nombre: '', apellidos: '', email: '', celular: '' });
      setFotoPreview(null);
      setFotoFile(null);
    }
    return () => {
      if (fotoPreview && fotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [modo, empleado]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setErrorMsg('');

    if (file) {
      if (!ALLOWED_MIMES.includes(file.type)) {
        setErrorMsg('Formato de imagen no permitido (png, jpg, jpeg, webp).');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg('La imagen debe pesar máximo 2MB.');
        return;
      }
    }

    if (fotoPreview && fotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview);
    }

    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : (empleado?.fotoUrl || null));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio.';
    if (!form.apellidos.trim()) return 'Los apellidos son obligatorios.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'El correo electrónico no es válido.';
    if (!/^\d{10}$/.test(form.celular.trim())) return 'El celular debe tener 10 dígitos.';
    return '';
  };

  const handlePrimary = async () => {
    setErrorMsg('');
    if (!token) {
      setErrorMsg('No hay sesión activa. Inicia sesión nuevamente.');
      return;
    }

    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('nombres', form.nombre.trim());
      fd.append('apellidos', form.apellidos.trim());
      fd.append('email', form.email.trim());
      fd.append('celular', form.celular.trim());
      if (fotoFile) fd.append('foto', fotoFile);

      let res, data;

      if (modo === 'editar' && form.id) {
        res = await fetch(`https://atempo.onrender.com/api/empleados/${form.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      } else {
        res = await fetch('https://atempo.onrender.com/api/empleados', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo guardar el empleado.');
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="overlay visible"></div>
      <div className="modal">
        <button className="cerrar-modal" onClick={onClose} disabled={submitting}>
          <FaTimes />
        </button>

        <h2 className="titulo-modal">
          {modo === 'editar' ? 'Editar empleado' : 'Nuevo empleado'}
        </h2>

        {errorMsg && <div className="alert error" role="alert">{errorMsg}</div>}

        <img
          src={fotoPreview || avatar}
          alt="Foto empleado"
          className="avatar-modal"
        />

        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button className="btn-cargar-foto" type="button" onClick={openFilePicker} disabled={submitting}>
          <FaUpload className="icono-upload" />
          Cargar foto (Opcional)
        </button>

        <div className="formulario-modal">
          <label>Nombre *</label>
          <input
            name="nombre"
            type="text"
            placeholder="Nombre del empleado"
            value={form.nombre}
            onChange={handleChange}
            maxLength={50}
            disabled={submitting}
            autoComplete="off"
          />

          <label>Apellidos *</label>
          <input
            name="apellidos"
            type="text"
            placeholder="Apellidos del empleado"
            value={form.apellidos}
            onChange={handleChange}
            maxLength={80}
            disabled={submitting}
            autoComplete="off"
          />

          <label>Correo electrónico *</label>
          <input
            name="email"
            type="email"
            placeholder="correo@dominio.com"
            value={form.email}
            onChange={handleChange}
            maxLength={100}
            disabled={submitting}
            autoComplete="off"
          />

          <label>Número celular *</label>
          <input
            name="celular"
            type="tel"
            placeholder="Número celular"
            value={form.celular}
            onChange={handleChange}
            onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={10}
            autoComplete="off"
            disabled={submitting}
          />

          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px', textAlign: 'center' }}>
            * Todos los campos de texto son obligatorios
          </p>

          <button className="btn-guardar" onClick={handlePrimary} disabled={submitting}>
            <FaSave className="icono-guardar" />
            {submitting ? 'Guardando…' : (modo === 'editar' ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalNuevoEmpleado;