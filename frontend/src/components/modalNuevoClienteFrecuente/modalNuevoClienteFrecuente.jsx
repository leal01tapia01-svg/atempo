import React, { useEffect, useRef, useState } from 'react';
import '../modalNuevoEmpleado/modalNuevoEmpleado.css';
import { FaTimes, FaSave, FaTrash } from 'react-icons/fa';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ModalNuevoClienteFrecuente = ({ modo = 'crear', cliente, onClose }) => {
  const token = localStorage.getItem('token');

  const [form, setForm] = useState({
    id: undefined,
    nombre: '',
    email: '',
    celular: '',
  });

  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (modo === 'editar' && cliente) {
      setForm({
        id: cliente.id,
        nombre: cliente.nombre || '',
        email: (cliente.email || cliente.correo || '').toLowerCase(),
        celular: cliente.celular || '',
      });
    } else {
      setForm({ id: undefined, nombre: '', email: '', celular: '' });
    }
  }, [modo, cliente?.id]);

  const debounceTimer = useRef(null);
  const lastAbort = useRef(null);

  const buscarSugerencias = (q) => {
    if (!q?.trim()) { setSugerencias([]); return; }
    if (!token) { setErrorMsg('No hay sesión activa'); return; }

    if (lastAbort.current) lastAbort.current.abort();
    const controller = new AbortController();
    lastAbort.current = controller;

    setLoading(true);
    fetch(`https://atempo.onrender.com/api/citas/sugerencias?nombre=${encodeURIComponent(q)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.message || 'No se pudieron cargar sugerencias');
        }
        setSugerencias(data.data || []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setSugerencias([]);
      })
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));

    if (name === 'nombre') {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => buscarSugerencias(value), 300);
    }
    if (name === 'celular') {
      e.target.value = value.replace(/[^0-9]/g, '');
    }
  };

  const handleSelectCliente = (cli) => {
    setForm((p) => ({
      ...p,
      nombre: cli.clienteNombre || '',
      email: (cli.clienteEmail || '').toLowerCase(),
      celular: cli.celular || '',
    }));
    setSugerencias([]);
  };

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.email.trim()) return 'El correo es obligatorio';
    if (!EMAIL_RE.test(form.email.trim())) return 'El correo no es válido';
    if (!/^\d{10}$/.test(form.celular.trim())) return 'El celular debe tener 10 dígitos';
    return '';
  };

  const handlePrimary = async () => {
    setErrorMsg('');
    if (!token) { setErrorMsg('No hay sesión activa'); return; }
    const v = validate();
    if (v) { setErrorMsg(v); return; }

    const payload = {
      nombre: form.nombre.trim(),
      correo: form.email.trim().toLowerCase(),
      celular: form.celular.trim(),
    };

    setSaving(true);
    try {
      let res, data;
      if (modo === 'editar' && form.id) {
        res = await fetch(`https://atempo.onrender.com/api/clientes-frecuentes/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('https://atempo.onrender.com/api/clientes-frecuentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo guardar');
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!token || !form.id) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`https://atempo.onrender.com/api/clientes-frecuentes/${form.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo eliminar');
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="overlay visible"></div>
      <div className="modal">
        <button className="cerrar-modal" onClick={onClose} disabled={saving}>
          <FaTimes />
        </button>

        <h2 className="titulo-modal">
          {modo === 'editar' ? 'Editar cliente frecuente' : 'Nuevo cliente frecuente'}
        </h2>

        {errorMsg && <div className="alert error" role="alert">{errorMsg}</div>}

        <div className="formulario-modal">
          <label>Nombre *</label>
          <input
            name="nombre"
            type="text"
            placeholder="Nombre del cliente"
            value={form.nombre}
            onChange={handleChange}
            autoComplete="off"
            disabled={saving}
          />
          {Boolean(sugerencias.length) && !loading && (
            <div className="sugerencias">
              {sugerencias.map((cli) => (
                <div
                  key={cli.id}
                  className="sugerencia-item"
                  onClick={() => handleSelectCliente(cli)}
                >
                  {cli.clienteNombre}
                </div>
              ))}
            </div>
          )}
          {loading && <div style={{ marginBottom: 8 }}>Buscando…</div>}

          <label>Correo electrónico *</label>
          <input
            name="email"
            type="email"
            placeholder="correo@dominio.com"
            value={form.email}
            onChange={handleChange}
            maxLength={100}
            autoComplete="email"
            disabled={saving}
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
            disabled={saving}
          />

          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px', textAlign: 'center' }}>
            * Todos los campos son obligatorios
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-guardar" onClick={handlePrimary} disabled={saving}>
              <FaSave className="icono-guardar" />
              {saving ? 'Guardando…' : (modo === 'editar' ? 'Actualizar' : 'Guardar')}
            </button>

            {modo === 'editar' && (
              <button className="btn-eliminar" onClick={handleEliminar} disabled={saving}>
                <FaTrash style={{ marginRight: 6 }} />
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalNuevoClienteFrecuente;