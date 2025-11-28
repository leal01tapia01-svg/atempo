import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/agendaSemanal.css';
import avatar from '../assets/avatar.png';
import { FaClock, FaChevronDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
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

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const newDate = new Date(d.setDate(diff));
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDay = (date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const id = `${year}-${month}-${day}`;

  return {
    id: id,
    dateObj: date,
    label: date.toLocaleDateString('es-MX', { weekday: 'long' }),
    date: date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
  };
};

const AgendaSemanal = () => {
  const token = localStorage.getItem('token');
  
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [bloqueMinutos, setBloqueMinutos] = useState(60);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  
  const [empleados, setEmpleados] = useState([]);
  const [citas, setCitas] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [visibleDayIndex, setVisibleDayIndex] = useState(0);
  const [daysPerPage, setDaysPerPage] = useState(5);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  const scrollRef = useRef(null);

  async function fetchAll() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [resEmp, resCitas] = await Promise.all([
        fetch('https://biological-ariel-atempo-05d801c3.koyeb.app/api/empleados?forAgenda=true', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://biological-ariel-atempo-05d801c3.koyeb.app/api/citas', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const empData = await resEmp.json();
      const citasData = await resCitas.json();

      if (!resEmp.ok || !empData?.ok)
        throw new Error(empData?.message || 'No se pudieron cargar empleados.');
      if (!resCitas.ok || !citasData?.ok)
        throw new Error(citasData?.message || 'No se pudieron cargar citas.');

      setEmpleados(empData.data || []);
      setCitas(citasData.data || []);
    } catch (e) {
      setErrorMsg(e.message || 'Error al cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

  useEffect(() => {
    const updateDaysPerPage = () => {
      const width = window.innerWidth;
      if (width < 500) setDaysPerPage(1);
      else if (width < 768) setDaysPerPage(2);
      else if (width < 992) setDaysPerPage(3);
      else if (width < 1200) setDaysPerPage(4);
      else setDaysPerPage(7);
    };
    updateDaysPerPage();
    window.addEventListener('resize', updateDaysPerPage);
    return () => window.removeEventListener('resize', updateDaysPerPage);
  }, []);

  const allDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => formatDay(addDays(weekStart, i)));
  }, [weekStart]);

  const days = allDays.slice(visibleDayIndex, visibleDayIndex + daysPerPage);

  const handlePrevDay = () => {
    if (visibleDayIndex > 0) setVisibleDayIndex((prev) => prev - 1);
  };
  const handleNextDay = () => {
    if (visibleDayIndex + daysPerPage < allDays.length) setVisibleDayIndex((prev) => prev + 1);
  };

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
    setVisibleDayIndex(0);
  };
  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
    setVisibleDayIndex(0);
  };

  const citasRender = useMemo(() => {
    const base = selectedEmployeeId === 'all'
      ? citas
      : citas.filter((c) => c.empleadoId === selectedEmployeeId);

    return base.map((c) => ({
      ...c,
      start: toHM(c.startAt),
      end: toHM(c.endAt),
      color: c.color || '#e0f2fe',
      startDateObj: new Date(c.startAt) 
    }));
  }, [citas, selectedEmployeeId]);

  const visibleAppointments = useMemo(() => {
    return citasRender.filter((app) =>
      days.some((day) => isSameDay(app.startDateObj, day.dateObj))
    );
  }, [citasRender, days]);

  const hours = useMemo(() => {
    let startHour = 8;
    let endHour = 20;

    if (visibleAppointments.length > 0) {
      const starts = visibleAppointments.map(app => {
         const d = new Date(app.startAt);
         return d.getHours();
      });
      const ends = visibleAppointments.map(app => {
         const d = new Date(app.endAt);
         return d.getHours() + (d.getMinutes() > 0 ? 1 : 0);
      });

      const minAppStart = Math.min(...starts);
      const maxAppEnd = Math.max(...ends);

      if (minAppStart < startHour) startHour = minAppStart;
      if (maxAppEnd > endHour) endHour = maxAppEnd;
    }

    const hs = [];
    for (let m = startHour * 60; m < endHour * 60; m += bloqueMinutos) {
      hs.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    }
    return hs;
  }, [bloqueMinutos, visibleAppointments]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hours]);

  const selectedEmployee =
    selectedEmployeeId === 'all'
      ? null
      : empleados.find((e) => e.id === selectedEmployeeId);

  const handleCitaGuardada = () => {
    setCitaSeleccionada(null);
    fetchAll();
  };

  const handleCitaEliminada = () => {
    setCitaSeleccionada(null);
    fetchAll();
  };

  const formatWeekRange = () => {
    const end = addDays(weekStart, 6);
    const opts = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${weekStart.toLocaleDateString('es-MX', opts)} - ${end.toLocaleDateString('es-MX', opts)}`;
  };

  return (
    <main className="weekly-agenda-main">
      <div className="agenda-header">
        <div className="nav-date">
          <button className="date-nav-btn" onClick={handlePrevWeek}>
            <FiChevronLeft />
          </button>
          <button className="date-nav-btn" onClick={handleNextWeek}>
            <FiChevronRight />
          </button>
          <span style={{ textTransform: 'capitalize' }}>{formatWeekRange()}</span>
        </div>

        <select
          className="filter-select filter-select-week"
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
        >
          <option value="all">Todos</option>
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombres} {emp.apellidos}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div className="employee-banner">
          <img src={selectedEmployee?.fotoUrl || avatar} alt={selectedEmployee?.nombres} />
          <span>{selectedEmployee?.nombres} {selectedEmployee?.apellidos}</span>
        </div>
      )}

      {allDays.length > daysPerPage && (
        <>
          <button
            className="scroll-btn scroll-btn-week left fixed-week-btn"
            onClick={handlePrevDay}
            disabled={visibleDayIndex === 0}
          >
            <FaArrowLeft />
          </button>

          <button
            className="scroll-btn scroll-btn-week right fixed-week-btn"
            onClick={handleNextDay}
            disabled={visibleDayIndex + daysPerPage >= allDays.length}
          >
            <FaArrowRight />
          </button>
        </>
      )}

      {errorMsg && <div className="alert error" role="alert" style={{ margin: '0 16px' }}>{errorMsg}</div>}
      {loading ? (
        <p style={{ margin: '16px' }}>Cargando agenda…</p>
      ) : (
        <div className="agenda-grid" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
          
          <div className="employee-header weekly-clock-header" style={{ position: 'relative' }}>
            <button className="weekly-clock-btn" onClick={() => setMostrarDropdown(!mostrarDropdown)}>
              <FaClock />
              <FaChevronDown className="dropdown-arrow" />
            </button>

            <div className={`time-dropdown ${mostrarDropdown ? 'show' : ''}`}>
              {[15, 30, 45, 60].map((min) => (
                <div
                  key={min}
                  className="time-dropdown-option"
                  onClick={() => {
                    setBloqueMinutos(min);
                    setMostrarDropdown(false);
                  }}
                >
                  {min} min
                </div>
              ))}
            </div>
          </div>

          {days.map((day, index) => (
            <div
              className={`employee-header ${index === days.length - 1 ? 'last' : ''}`}
              key={day.id}
            >
              <span className="day-agenda">
                {day.label.charAt(0).toUpperCase() + day.label.slice(1)}
                <br />
                {day.date}
              </span>
            </div>
          ))}

          {hours.map((hour, index) => (
            <React.Fragment key={hour}>
              <div 
                className="hour-cell" 
                ref={hour === '08:00' || (index === 0 && !hours.includes('08:00')) ? scrollRef : null}
              >
                {hour}
              </div>

              {days.map((day, index) => (
                <div
                  className={`time-cell ${index === days.length - 1 ? 'last' : ''}`}
                  key={`${day.id}-${hour}`}
                >
                  {visibleAppointments
                    .filter((app) => {
                      if (!isSameDay(app.startDateObj, day.dateObj)) return false;
                      const [startH, startM] = app.start.split(':').map(Number);
                      const startTotal = startH * 60 + startM;
                      const [cellH, cellM] = hour.split(':').map(Number);
                      const cellStart = cellH * 60 + cellM;
                      const cellEnd = cellStart + bloqueMinutos;

                      return startTotal >= cellStart && startTotal < cellEnd;
                    })
                    .map((app, idx) => {
                      const [sH, sM] = app.start.split(':').map(Number);
                      const [eH, eM] = app.end.split(':').map(Number);
                      const startTotal = sH * 60 + sM;
                      const endTotal = eH * 60 + eM;
                      const durationMin = Math.max(15, endTotal - startTotal);
                      
                      const [cellH, cellM] = hour.split(':').map(Number);
                      const cellStart = cellH * 60 + cellM;
                      const offsetMin = startTotal - cellStart;

                      const top = (offsetMin / bloqueMinutos) * 60;
                      const height = (durationMin / bloqueMinutos) * 60;

                      return (
                        <div
                          className={`appointment appointment-${bloqueMinutos}`}
                          key={`${app.id}-${idx}`}
                          style={{
                            backgroundColor: app.color,
                            height: `${height}px`,
                            top: `${top - 0.5}px`,
                            left: '5%',
                            right: '5%',
                            position: 'absolute',
                            cursor: 'pointer',
                            zIndex: 10,
                          }}
                          onClick={() => setCitaSeleccionada(app)}
                          title={`${app.titulo} (${app.start}–${app.end})`}
                        >
                          <strong>{app.clienteNombre}</strong>
                          <div style={{ fontSize: '0.85em' }}>{app.titulo}</div>
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

export default AgendaSemanal;