import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/empleados.css';
import { FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';
import avatar from '../assets/avatar.png';
import ModalNuevoEmpleado from '../components/modalNuevoEmpleado/modalNuevoEmpleado';
import ModalConfirmacion from '../components/modalConfirmacion/modalConfirmacion';

const PLAN_LIMITS = {
  GRATIS: 3,
  POPULAR: 8,
  PRO: Infinity,
};

const Empleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modo, setModo] = useState('crear');
  const [empleadoActual, setEmpleadoActual] = useState(null);

  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const isAdmin = currentUser?.role !== 'EMPLEADO';
  const permisosModulo = currentUser?.permisos?.empleados || {};

  const puedeCrear = isAdmin || permisosModulo.crear;
  const puedeEditar = isAdmin || permisosModulo.editar;
  const puedeEliminar = isAdmin || permisosModulo.eliminar;

  const planActual = currentUser?.plan || 'GRATIS';
  const limiteEmpleados = PLAN_LIMITS[planActual] || 3;
  const empleadosRegistrados = empleados.length;
  const limiteAlcanzado = empleadosRegistrados >= limiteEmpleados;

  async function fetchEmpleados() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('https://atempo.onrender.com/api/empleados', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudieron cargar los empleados.');
      }
      setEmpleados(data.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar empleados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setErrorMsg('No hay sesión activa.');
      setLoading(false);
      return;
    }
    fetchEmpleados();
  }, [token]);

  const abrirCrear = () => {
    if (limiteAlcanzado) return;
    setModo('crear');
    setEmpleadoActual(null);
    setMostrarModal(true);
  };

  const abrirEditar = (emp) => {
    setModo('editar');
    setEmpleadoActual(emp);
    setMostrarModal(true);
  };

  const cerrarModal = (shouldRefresh = false) => {
    setMostrarModal(false);
    setEmpleadoActual(null);
    if (shouldRefresh) fetchEmpleados();
  };

  const abrirConfirmar = (emp) => {
    setEmpleadoAEliminar(emp);
    setMostrarConfirm(true);
  };
  
  const cerrarConfirmar = () => {
    setEmpleadoAEliminar(null);
    setMostrarConfirm(false);
  };

  const confirmarEliminar = async () => {
    if (!empleadoAEliminar) return;
    setDeleting(true);
    try {
      const res = await fetch(`https://atempo.onrender.com/api/empleados/${empleadoAEliminar.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo eliminar el empleado.');
      }
      await fetchEmpleados();
      cerrarConfirmar();
    } catch (err) {
      alert(err.message || 'Error al eliminar.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="empleados-container">
      <div className="header-empleados">
        <div>
            <h2 className="titulo-empleados">Empleados</h2>
            {!loading && isAdmin && (
                <div style={{ marginTop: '5px', fontSize: '0.9rem', color: '#555' }}>
                    <p style={{ margin: 0 }}>
                        Plan <strong>{planActual}</strong>: {empleadosRegistrados} / {limiteEmpleados === Infinity ? '∞' : limiteEmpleados} empleados.
                    </p>
                    {limiteAlcanzado && limiteEmpleados !== Infinity && (
                        <p style={{ margin: '4px 0 0', color: '#d93025', fontSize: '0.85rem' }}>
                            Has alcanzado el límite de tu plan. <Link to="/planes" style={{ color: '#1976d2', textDecoration: 'underline' }}>Mejora tu plan aquí</Link> para agregar más.
                        </p>
                    )}
                    {!limiteAlcanzado && limiteEmpleados !== Infinity && (
                        <p style={{ margin: '2px 0 0', color: '#2e7d32', fontSize: '0.8rem' }}>
                            Puedes registrar {limiteEmpleados - empleadosRegistrados} más.
                        </p>
                    )}
                </div>
            )}
        </div>

        {puedeCrear && (
          <button 
            className="nuevo-empleado-btn" 
            onClick={abrirCrear}
            disabled={limiteAlcanzado}
            style={limiteAlcanzado ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#9e9e9e' } : {}}
            title={limiteAlcanzado ? "Límite de empleados alcanzado" : "Registrar nuevo empleado"}
          >
            Nuevo empleado <FaUserPlus className="icono-btn" />
          </button>
        )}
      </div>

      {errorMsg && <div className="alert error" role="alert">{errorMsg}</div>}
      
      {loading ? (
        <p className="cargando">Cargando empleados…</p>
      ) : (
        <table className="tabla-empleados">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre completo</th>
              <th>Correo</th>
              <th>Número celular</th>
              {(puedeEditar || puedeEliminar) && <th>Opciones</th>}
            </tr>
          </thead>
          <tbody>
            {empleados.length === 0 ? (
              <tr>
                <td colSpan={(puedeEditar || puedeEliminar) ? 5 : 4} style={{ textAlign: 'center', opacity: 0.7 }}>
                  Aún no tienes empleados registrados.
                </td>
              </tr>
            ) : (
              empleados.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <img
                      src={emp.fotoUrl || avatar}
                      alt="avatar"
                      className="avatar-empleado"
                    />
                  </td>
                  <td>
                    <span className="cell-wrap clamp-2-3">
                      {`${emp.nombres} ${emp.apellidos}`}
                      {currentUser && emp.id === currentUser.id && (
                        <span style={{ fontSize: '0.8em', color: '#1976d2', marginLeft: '5px' }}>(Tú)</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="cell-wrap clamp-2-3">{emp.email}</span>
                  </td>
                  <td>
                    <span className="cell-wrap">{emp.celular}</span>
                  </td>
                  
                  {(puedeEditar || puedeEliminar) && (
                    <td className="td-opciones">
                      {puedeEditar && (
                        <FaEdit 
                          className="icono-editar" 
                          title="Editar empleado"
                          onClick={() => abrirEditar(emp)} 
                        />
                      )}
                      
                      {puedeEliminar && (
                        emp.id !== currentUser?.id ? (
                          <FaTrash 
                            className="icono-borrar" 
                            title="Eliminar empleado"
                            onClick={() => abrirConfirmar(emp)} 
                          />
                        ) : (
                          <span style={{ width: '20px', display: 'inline-block' }}></span>
                        )
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {mostrarModal && (
        <ModalNuevoEmpleado
          modo={modo}
          empleado={empleadoActual}
          onClose={cerrarModal}
          onSaved={() => cerrarModal(true)}
        />
      )}

      {mostrarConfirm && (
        <ModalConfirmacion
          titulo="Eliminar empleado"
          mensaje={`¿Seguro que deseas eliminar a "${empleadoAEliminar?.nombres} ${empleadoAEliminar?.apellidos}"? Esta acción no se puede deshacer.`}
          textoCancelar="Cancelar"
          textoConfirmar={deleting ? 'Eliminando…' : 'Eliminar'}
          onCancel={cerrarConfirmar}
          onConfirm={confirmarEliminar}
          disabled={deleting}
        />
      )}
    </div>
  );
};

export default Empleados;