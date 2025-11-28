import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaSave, FaTrash, FaBell } from 'react-icons/fa';
import './modalCita.css';
import ModalConfirmacion from '../modalConfirmacion/modalConfirmacion';

const coloresDisponibles = [
  '#ffe4e6', '#ffedd5', '#fef9c3', '#bbf7d0',
  '#dcfce7', '#e0f2fe', '#b3e5fc', '#ede9fe', '#fce7f3'
];

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

const toDateInput = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimeInput = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const buildLocalISO = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}`).toISOString();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ModalCita = ({ modo = 'crear', cita = {}, onClose, onGuardar, onEliminar }) => {
  const token = localStorage.getItem('token');

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const isAdmin = currentUser?.role !== 'EMPLEADO';
  const permisosCitas = currentUser?.permisos?.citas || {};

  const puedeCrear = isAdmin || permisosCitas.crear;
  const puedeEditar = isAdmin || permisosCitas.editar;
  const puedeEliminar = isAdmin || permisosCitas.eliminar;
  const isReadOnly = modo === 'editar' && !puedeEditar;

  const [empleados, setEmpleados] = useState([]);
  const [loadingEmps, setLoadingEmps] = useState(false);
  
  const [clientesFrecuentes, setClientesFrecuentes] = useState([]);

  const [formulario, setFormulario] = useState({
    service: '',
    encargado: '',
    fecha: '',
    start: '',
    end: '',
    client: '',
    clientPhone: '',
    clientEmail: '',
    nota: '',
    color: coloresDisponibles[0],
    tieneRecordatorio: false,
    recAnticipacionHoras: 24,
    recIntervaloMinutos: 60,
    recCantidad: 1
  });

  const puedeActivarRecordatorios = 
    formulario.client.trim().length > 0 &&
    /^\d{10}$/.test(formulario.clientPhone.trim()) &&
    emailRegex.test(formulario.clientEmail.trim());

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const abrirConfirmar = () => setMostrarConfirm(true);
  const cerrarConfirmar = () => setMostrarConfirm(false);

  useEffect(() => {
    let cancelled = false;
    const cargarDatos = async () => {
      try {
        setLoadingEmps(true);
        const [resEmp, resClientes] = await Promise.all([
          fetch('/api/empleados?forAgenda=true', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/clientes-frecuentes', { headers: { Authorization: `Bearer ${token}` } }) 
        ]);

        const dataEmp = await resEmp.json();
        
        let dataClientes = { ok: false, data: [] };
        try {
            if(resClientes.ok) dataClientes = await resClientes.json();
        } catch(e) { console.log('No se pudieron cargar clientes frecuentes'); }

        if (!resEmp.ok || !dataEmp?.ok) throw new Error(dataEmp?.message || 'No se pudieron cargar los empleados.');
        
        if (!cancelled) {
          setEmpleados(dataEmp.data || []);
          if (dataClientes.ok) {
            setClientesFrecuentes(dataClientes.data || []);
          }
        }
      } catch (err) {
        if (!cancelled) console.error(err.message || 'Error al cargar datos iniciales.');
      } finally {
        if (!cancelled) setLoadingEmps(false);
      }
    };

    if (token) cargarDatos();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    setErrorMsg('');

    if (modo === 'editar' && cita && cita.id) {
      const empleadoId =
        cita.empleado?.id ??
        cita.empleadoId ??
        (typeof cita.encargado === 'string' && cita.encargado.match(/^[0-9a-fA-F-]{36}$/) ? cita.encargado : '');

      setFormulario({
        service: cita.titulo || cita.service || '',
        encargado: empleadoId || '',
        fecha: cita.startAt ? toDateInput(cita.startAt) : (cita.fecha || ''),
        start: cita.startAt ? toTimeInput(cita.startAt) : (cita.start || ''),
        end:   cita.endAt   ? toTimeInput(cita.endAt)   : (cita.end || ''),
        client: cita.clienteNombre || cita.client || '',
        clientPhone: cita.celular || cita.clientPhone || '',
        clientEmail: (cita.clienteEmail || cita.clientEmail || '').toLowerCase(),
        nota: cita.nota || '',
        color: cita.color || coloresDisponibles[0],
        
        tieneRecordatorio: cita.tieneRecordatorio || false,
        recAnticipacionHoras: cita.recAnticipacionHoras || 24,
        recIntervaloMinutos: cita.recIntervaloMinutos || 60,
        recCantidad: cita.recCantidad || 1,
      });
    } else {
      setFormulario({
        service: '',
        encargado: '',
        fecha: '',
        start: '',
        end: '',
        client: '',
        clientPhone: '',
        clientEmail: '',
        nota: '',
        color: coloresDisponibles[0],
        tieneRecordatorio: false,
        recAnticipacionHoras: 24,
        recIntervaloMinutos: 60,
        recCantidad: 1
      });
    }
  }, [modo, cita?.id]);

  useEffect(() => {
    if (formulario.tieneRecordatorio && !puedeActivarRecordatorios) {
        setFormulario(prev => ({ ...prev, tieneRecordatorio: false }));
    }
  }, [puedeActivarRecordatorios]);

  const injectedCurrentEmp = useRef(false);
  useEffect(() => {
    if (injectedCurrentEmp.current) return;
    if (modo !== 'editar' || !cita || !cita.empleado?.id) return;
    const currentEmp = {
      id: cita.empleado.id,
      nombres: cita.empleado.nombres,
      apellidos: cita.empleado.apellidos,
      isActive: cita.empleado.isActive
    };
    if (empleados.every(e => e.id !== currentEmp.id)) {
      setEmpleados(prev => [currentEmp, ...prev]);
    }
    injectedCurrentEmp.current = true;
  }, [modo, cita?.empleado?.id, empleados.length]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'client') {
        const clienteEncontrado = clientesFrecuentes.find(
            c => c.nombre.toLowerCase() === value.toLowerCase()
        );

        if (clienteEncontrado) {
            setFormulario(prev => ({
                ...prev,
                client: value,
                clientPhone: clienteEncontrado.celular || '',
                clientEmail: clienteEncontrado.correo || ''
            }));
            return;
        }
    }

    setFormulario(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleColorSelect = (color) => setFormulario(prev => ({ ...prev, color }));
  
  const validate = () => {
    if (!formulario.service.trim()) return 'El título/servicio es obligatorio.';
    if (!formulario.encargado) return 'Selecciona un encargado.';
    if (!formulario.fecha) return 'La fecha es obligatoria.';
    if (!formulario.start || !formulario.end) return 'Debes indicar hora de inicio y fin.';
    
    const startISO = buildLocalISO(formulario.fecha, formulario.start);
    const endISO   = buildLocalISO(formulario.fecha, formulario.end);
    if (new Date(startISO) >= new Date(endISO)) return 'La hora de inicio debe ser anterior a la hora de fin.';
    
    if (formulario.clientPhone.trim() && !/^\d{10}$/.test(formulario.clientPhone.trim())) {
        return 'El celular debe tener exactamente 10 dígitos.';
    }
    
    if (formulario.clientEmail.trim() && !emailRegex.test(formulario.clientEmail.trim())) {
        return 'El email del cliente no es válido.';
    }

    if (formulario.color && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(formulario.color)) return 'El color no es válido.';
    
    if (formulario.tieneRecordatorio) {
        if (!formulario.recAnticipacionHoras || formulario.recAnticipacionHoras < 1 || formulario.recAnticipacionHoras > 72) {
            return 'La anticipación debe ser entre 1 y 72 horas.';
        }
        if (!formulario.recCantidad || formulario.recCantidad < 1 || formulario.recCantidad > 3) {
            return 'La cantidad de recordatorios debe ser entre 1 y 3.';
        }
    }

    return '';
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!token) {
      setErrorMsg('No hay sesión activa. Inicia sesión nuevamente.');
      return;
    }
    const v = validate();
    if (v) { setErrorMsg(v); return; }

    const payload = {
      titulo: formulario.service.trim(),
      empleadoId: formulario.encargado,
      clienteNombre: formulario.client.trim() || 'Cliente sin nombre', 
      celular: formulario.clientPhone.trim() || '0000000000',
      clienteEmail: formulario.clientEmail.trim().toLowerCase() || 'sin@correo.com',
      nota: formulario.nota?.trim() || null,
      color: formulario.color || null,
      startAt: buildLocalISO(formulario.fecha, formulario.start),
      endAt:   buildLocalISO(formulario.fecha, formulario.end),
      
      tieneRecordatorio: formulario.tieneRecordatorio,
      recAnticipacionHoras: formulario.tieneRecordatorio ? parseInt(formulario.recAnticipacionHoras) : null,
      recIntervaloMinutos: formulario.tieneRecordatorio ? parseInt(formulario.recIntervaloMinutos) : null,
      recCantidad: formulario.tieneRecordatorio ? parseInt(formulario.recCantidad) : null,
    };

    setSubmitting(true);
    try {
      let res, data;
      if (modo === 'editar' && cita?.id) {
        if (!puedeEditar) throw new Error('No tienes permiso para editar esta cita.');

        res = await fetch(`/api/citas/${cita.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      } else {
        if (!puedeCrear) throw new Error('No tienes permiso para crear citas.');

        res = await fetch('/api/citas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      }
      data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo guardar la cita.');
      onGuardar?.(data.data);
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmarEliminar = async () => {
    setErrorMsg('');
    if (!token) {
      setErrorMsg('No hay sesión activa. Inicia sesión nuevamente.');
      return;
    }
    if (!puedeEliminar) {
      setErrorMsg('No tienes permiso para eliminar citas.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/citas/${cita.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo eliminar la cita.');
      onEliminar?.(cita.id);
      setMostrarConfirm(false);
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const mostrarBotonGuardar = (modo === 'crear' && puedeCrear) || (modo === 'editar' && puedeEditar);

  return (
    <>
      <div className="agendar-overlay visible"></div>
      <div className="agendar-modal">
        <div className="agendar-header">
          <button className="agendar-cerrar-modal" onClick={onClose} disabled={submitting}>
            <FaTimes />
          </button>
          <h2 className="agendar-titulo-modal">
            {modo === 'editar' ? (isReadOnly ? 'Detalles' : 'Editar cita') : 'Agendar cita'}
          </h2>
        </div>

        <div className="agendar-formulario">
          {isReadOnly && (
            <div className="full-width" style={{ padding: '10px', backgroundColor: '#f3f4f6', color: '#555', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '10px' }}>
              Modo lectura: No tienes permisos para editar.
            </div>
          )}

          <div>
            <label>Título o Servicio *</label>
            <input
              name="service"
              type="text"
              placeholder="Ej: Corte de cabello"
              value={formulario.service}
              onChange={handleChange}
              autoComplete="off"
              disabled={submitting || isReadOnly}
            />
          </div>

          <div>
            <label>Encargado *</label>
            <select
              name="encargado"
              value={formulario.encargado}
              onChange={handleChange}
              disabled={submitting || loadingEmps || isReadOnly}
            >
              <option value="">Selecciona...</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombres} {emp.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Fecha *</label>
            <input
              name="fecha"
              type="date"
              value={formulario.fecha}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              min={getTodayStr()}
            />
          </div>

          <div>
            <label>Hora *</label>
            <div className="agendar-horario">
              <input
                name="start"
                type="time"
                value={formulario.start}
                onChange={handleChange}
                disabled={submitting || isReadOnly}
              />
              <span>a</span>
              <input
                name="end"
                type="time"
                value={formulario.end}
                onChange={handleChange}
                disabled={submitting || isReadOnly}
              />
            </div>
          </div>

          <div className="agendar-info-opcionales full-width">
            Los siguientes campos (Cliente, Contacto, Nota) son <strong>opcionales</strong>.
          </div>

          <div>
            <label>Cliente</label>
            <input
              name="client"
              type="text"
              list="lista-clientes-frecuentes"
              autoComplete="off"
              placeholder="Buscar o escribir nombre"
              value={formulario.client}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
            />
            <datalist id="lista-clientes-frecuentes">
                {clientesFrecuentes.map(c => (
                    <option key={c.id} value={c.nombre} />
                ))}
            </datalist>
          </div>

          <div>
            <label>Celular</label>
            <input
              name="clientPhone"
              type="tel"
              placeholder="10 dígitos"
              value={formulario.clientPhone}
              onChange={handleChange}
              onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={10}
              autoComplete="off"
              disabled={submitting || isReadOnly}
            />
          </div>

          <div className="full-width">
            <label>Email del cliente</label>
            <input
              name="clientEmail"
              type="email"
              placeholder="cliente@correo.com"
              value={formulario.clientEmail}
              onChange={handleChange}
              autoComplete="email"
              inputMode="email"
              maxLength={120}
              disabled={submitting || isReadOnly}
            />
          </div>

          <div className="full-width">
            <label>Nota</label>
            <input
              name="nota"
              type="text"
              placeholder="Descripción o nota adicional"
              value={formulario.nota}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              autoComplete="off"
            />
          </div>

          <div className="full-width" style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <label 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '1rem', 
                    color: puedeActivarRecordatorios ? '#1976d2' : '#999', 
                    cursor: puedeActivarRecordatorios ? 'pointer' : 'not-allowed' 
                }}
                title={puedeActivarRecordatorios ? "" : "Ingresa cliente, celular y email para activar"}
            >
                <input 
                    type="checkbox" 
                    name="tieneRecordatorio"
                    checked={formulario.tieneRecordatorio}
                    onChange={handleChange}
                    disabled={submitting || isReadOnly || !puedeActivarRecordatorios}
                    style={{ width: 'auto' }}
                />
                <FaBell /> Habilitar recordatorios por correo
            </label>

            {formulario.tieneRecordatorio && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr', 
                    gap: '10px', 
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    <div>
                        <label style={{ fontSize: '0.8rem' }}>Empezar antes (Horas)</label>
                        <input 
                            type="number" 
                            name="recAnticipacionHoras"
                            min="1" max="72"
                            value={formulario.recAnticipacionHoras}
                            onChange={handleChange}
                            disabled={submitting || isReadOnly}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem' }}>Intervalo</label>
                        <select 
                            name="recIntervaloMinutos"
                            value={formulario.recIntervaloMinutos}
                            onChange={handleChange}
                            disabled={submitting || isReadOnly}
                        >
                            <option value="30">Cada 30 min</option>
                            <option value="60">Cada 1 hora</option>
                            <option value="120">Cada 2 horas</option>
                            <option value="180">Cada 3 horas</option>
                            <option value="360">Cada 6 horas</option>
                            <option value="720">Cada 12 horas</option>
                            <option value="1440">Cada 24 horas</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem' }}>Cantidad (Máx 3)</label>
                        <select 
                            name="recCantidad"
                            value={formulario.recCantidad}
                            onChange={handleChange}
                            disabled={submitting || isReadOnly}
                        >
                            <option value="1">1 vez</option>
                            <option value="2">2 veces</option>
                            <option value="3">3 veces</option>
                        </select>
                    </div>
                </div>
            )}
          </div>

          <div className="full-width">
            <label style={{textAlign:'center', marginBottom:'8px', marginTop:'10px'}}>Color de etiqueta</label>
            <div className="agendar-colores">
              {coloresDisponibles.map((color, i) => (
                <span
                  key={i}
                  className={`agendar-color ${formulario.color === color ? 'seleccionado' : ''}`}
                  style={{ 
                    backgroundColor: color,
                    opacity: (submitting || isReadOnly) ? 0.6 : 1
                  }}
                  onClick={() => !submitting && !isReadOnly && handleColorSelect(color)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="agendar-footer-btn">
          {errorMsg && (
            <div className="alert error full-width" role="alert">
                {errorMsg}
            </div>
          )}
          
          {mostrarBotonGuardar && (
            <button className="agendar-btn-guardar" onClick={handleSubmit} disabled={submitting}>
              <FaSave />
              {submitting ? 'Guardando…' : (modo === 'editar' ? 'Guardar cambios' : 'Agendar')}
            </button>
          )}

          {modo === 'editar' && puedeEliminar && (
            <button className="agendar-btn-eliminar" onClick={abrirConfirmar} disabled={submitting}>
              <FaTrash />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {mostrarConfirm && (
        <ModalConfirmacion
          titulo="Eliminar cita"
          mensaje="¿Seguro que deseas eliminar esta cita?"
          textoCancelar="Cancelar"
          textoConfirmar="Eliminar"
          onCancel={cerrarConfirmar}
          onConfirm={confirmarEliminar}
        />
      )}
    </>
  );
};

export default ModalCita;