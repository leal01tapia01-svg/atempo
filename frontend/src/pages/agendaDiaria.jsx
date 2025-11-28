import React, { useEffect, useRef, useState, useMemo } from 'react';
import '../styles/agendaDiaria.css';
import avatar from '../assets/avatar.png';
import { FaClock, FaArrowLeft, FaArrowRight, FaChevronDown } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ModalCita from '../components/modalCita/modalCita';

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

const toHM = (dateLike) => {
  const d = new Date(dateLike);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const AgendaDiaria = () => {
  const token = localStorage.getItem('token');

  const [fechaActual, setFechaActual] = useState(new Date());

  const [bloqueMinutos, setBloqueMinutos] = useState(60);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [empleados, setEmpleados] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [visibleIndex, setVisibleIndex] = useState(0);
  const [employeesPerPage, setEmployeesPerPage] = useState(4);
  const [filtroEmpleado, setFiltroEmpleado] = useState('all');

  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFechaActual(nuevaFecha);
  };

  const getEtiquetaFecha = () => {
    const hoy = new Date();
    const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    const antier = new Date(hoy); antier.setDate(hoy.getDate() - 2);
    const pasadoManana = new Date(hoy); pasadoManana.setDate(hoy.getDate() + 2);

    if (isSameDay(fechaActual, hoy)) return 'Hoy';
    if (isSameDay(fechaActual, manana)) return 'Mañana';
    if (isSameDay(fechaActual, ayer)) return 'Ayer';
    if (isSameDay(fechaActual, antier)) return 'Antier';
    if (isSameDay(fechaActual, pasadoManana)) return 'Pasado mañana';

    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    return fechaActual.toLocaleDateString('es-ES', opciones);
  };

  async function fetchAll() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [resEmp, resCitas] = await Promise.all([
        fetch('https://atempo.onrender.com/api/empleados?forAgenda=true', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://atempo.onrender.com/api/citas', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const empData = await resEmp.json();
      const citasData = await resCitas.json();

      if (!resEmp.ok || !empData?.ok) throw new Error(empData?.message || 'No se pudieron cargar empleados.');
      if (!resCitas.ok || !citasData?.ok) throw new Error(citasData?.message || 'No se pudieron cargar citas.');

      setEmpleados(empData.data || []);
      setCitas(citasData.data || []);
    } catch (e) {
      setErrorMsg(e.message || 'Error al cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) fetchAll(); }, [token]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setEmployeesPerPage(1);
      else if (w < 915) setEmployeesPerPage(2);
      else if (w < 1190) setEmployeesPerPage(3);
      else setEmployeesPerPage(4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const empleadosFiltrados = useMemo(() => {
    const list = filtroEmpleado === 'all'
      ? empleados
      : empleados.filter(e => e.id === filtroEmpleado);
    return list.slice(visibleIndex, visibleIndex + employeesPerPage);
  }, [empleados, filtroEmpleado, visibleIndex, employeesPerPage]);

  const handlePrev = () => visibleIndex > 0 && setVisibleIndex(visibleIndex - 1);
  const handleNext = () => {
    const total = filtroEmpleado === 'all'
      ? empleados.length
      : empleados.filter(e => e.id === filtroEmpleado).length;
    if (visibleIndex + employeesPerPage < total) setVisibleIndex(visibleIndex + 1);
  };

  const citasRender = useMemo(() => {
    const citasDelDia = citas.filter(c => {
      const fechaCita = new Date(c.startAt);
      return isSameDay(fechaCita, fechaActual);
    });

    const base = filtroEmpleado === 'all'
      ? citasDelDia
      : citasDelDia.filter(c => c.empleadoId === filtroEmpleado);

    return base.map(c => ({
      id: c.id,
      empleadoId: c.empleadoId,
      client: c.clienteNombre,
      service: c.titulo,
      startISO: c.startAt,
      endISO: c.endAt,
      start: toHM(c.startAt),
      end: toHM(c.endAt),
      color: c.color || '#e0f2fe',
    }));
  }, [citas, filtroEmpleado, fechaActual]);

  const [minStartHour, hours] = useMemo(() => {
    if (citasRender.length === 0) {
      const hs = [];
      for (let m = 8 * 60; m < 18 * 60; m += bloqueMinutos) {
        hs.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
      }
      return [8, hs];
    }

    const starts = citasRender.map(c => new Date(c.startISO).getHours());
    const ends = citasRender.map(c => new Date(c.endISO).getHours());
    const minH = Math.max(0, Math.min(...starts) - 1);
    const maxH = Math.min(23, Math.max(...ends) + 1);
    const hs = [];
    for (let m = minH * 60; m < (maxH + 1) * 60; m += bloqueMinutos) {
      hs.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    }
    return [minH, hs];
  }, [citasRender, bloqueMinutos]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [minStartHour]);

  const handleOpenCita = (c) => {
    const original = citas.find(x => x.id === c.id) || c;
    setCitaSeleccionada(original);
  };

  const handleCitaGuardada = () => {
    setCitaSeleccionada(null);
    fetchAll();
  };

  const handleCitaEliminada = () => {
    setCitaSeleccionada(null);
    fetchAll();
  };

  return (
    <main className="daily-agenda-main">
      <div className="agenda-header">
        <div className="nav-date">
          <button className="date-nav-btn" onClick={() => cambiarDia(-1)}>
            <FiChevronLeft />
          </button>
          <button className="date-nav-btn" onClick={() => cambiarDia(1)}>
            <FiChevronRight />
          </button>
          <span style={{ textTransform: 'capitalize', minWidth: '150px', textAlign: 'center' }}>
            {getEtiquetaFecha()}
          </span>
        </div>

        <select
          className="filter-select"
          value={filtroEmpleado}
          onChange={(e) => { setVisibleIndex(0); setFiltroEmpleado(e.target.value === 'all' ? 'all' : e.target.value); }}
        >
          <option value="all">Todos</option>
          {empleados.map(e => (
            <option key={e.id} value={e.id}>
              {e.nombres} {e.apellidos}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && <div className="alert error" role="alert" style={{margin:'0 16px'}}>{errorMsg}</div>}
      {loading ? (
        <p style={{margin:'16px'}}>Cargando agenda…</p>
      ) : (
        <div className="agenda-grid" style={{ gridTemplateColumns: `80px repeat(${empleadosFiltrados.length}, 1fr)` }}>
          {(filtroEmpleado === 'all' ? empleados.length : empleadosFiltrados.length) > employeesPerPage && (
            <>
              <button className="scroll-btn left fixed-btn" onClick={handlePrev} disabled={visibleIndex === 0}>
                <FaArrowLeft />
              </button>
              <button
                className="scroll-btn right fixed-btn"
                onClick={handleNext}
                disabled={visibleIndex + employeesPerPage >= (filtroEmpleado === 'all' ? empleados.length : empleadosFiltrados.length)}
              >
                <FaArrowRight />
              </button>
            </>
          )}

          <div className="employee-header clock-header" style={{ position: 'relative' }}>
            <button className="clock-btn" onClick={() => setMostrarDropdown(!mostrarDropdown)}>
              <FaClock />
              <FaChevronDown className="dropdown-arrow" />
            </button>
            <div className={`time-dropdown ${mostrarDropdown ? 'show' : ''}`}>
              {[15, 30, 45, 60].map((min) => (
                <div
                  key={min}
                  className="time-dropdown-option"
                  onClick={() => { setBloqueMinutos(min); setMostrarDropdown(false); }}
                >
                  {min} min
                </div>
              ))}
            </div>
          </div>

          {empleadosFiltrados.map((e, idx) => (
            <div
              className={`employee-header ${idx === 0 ? 'first' : ''} ${idx === empleadosFiltrados.length - 1 ? 'last' : ''}`}
              key={e.id}
            >
              <img src={e.fotoUrl || avatar} alt={`${e.nombres} ${e.apellidos}`} />
              <span>{e.nombres} {e.apellidos}</span>
            </div>
          ))}

          {hours.map((hour, i) => (
            <React.Fragment key={hour}>
              <div className="hour-cell" ref={i === 0 ? scrollRef : null}>{hour}</div>

              {empleadosFiltrados.map((emp, idx) => (
                <div
                  className={`time-cell ${idx === 0 ? 'first' : ''} ${idx === empleadosFiltrados.length - 1 ? 'last' : ''}`}
                  key={`${emp.id}-${hour}`}
                >
                  {citasRender
                    .filter(app => {
                      if (app.empleadoId !== emp.id) return false;

                      const [cellH, cellM] = hour.split(':').map(Number);
                      const cellStart = cellH * 60 + cellM;
                      const cellEnd = cellStart + bloqueMinutos;

                      const [aH, aM] = app.start.split(':').map(Number);
                      const appStart = aH * 60 + aM;

                      return appStart >= cellStart && appStart < cellEnd;
                    })
                    .map((app, k) => {
                      const [sH, sM] = app.start.split(':').map(Number);
                      const [eH, eM] = app.end.split(':').map(Number);
                      const startTotal = sH * 60 + sM;
                      const endTotal = eH * 60 + eM;
                      const duration = Math.max(15, endTotal - startTotal);
                      const [cH, cM] = hour.split(':').map(Number);
                      const cellStart = cH * 60 + cM;
                      const offset = startTotal - cellStart;

                      const top = (offset / bloqueMinutos) * 60;
                      const height = (duration / bloqueMinutos) * 60;

                      return (
                        <div
                          className={`appointment appointment-${bloqueMinutos}`}
                          key={`${app.id}-${k}`}
                          style={{
                            backgroundColor: app.color,
                            height: `${height}px`,
                            top: `${top - 0.4}px`,
                            position: 'absolute',
                            left: '16%',
                            right: '16%',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenCita(app)}
                          title={`${app.service} (${app.start}–${app.end})`}
                        >
                          <strong>{app.client}</strong>
                          <div>{app.service}</div>
                          <small>{app.start} - {app.end}</small>
                        </div>
                      );
                    })}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {citaSeleccionada && (
        <ModalCita
          modo="editar"
          cita={citaSeleccionada}
          onClose={() => setCitaSeleccionada(null)}
          onGuardar={handleCitaGuardada}
          onEliminar={handleCitaEliminada}
        />
      )}
    </main>
  );
};

export default AgendaDiaria;