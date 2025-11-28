import React, { useEffect, useState } from 'react';
import '../styles/clientesFrecuentes.css';
import ModalNuevoClienteFrecuente from '../components/modalNuevoClienteFrecuente/modalNuevoClienteFrecuente';
import ModalConfirmacion from '../components/modalConfirmacion/modalConfirmacion';
import { FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';

const ClientesFrecuentes = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modo, setModo] = useState('crear');
  const [clienteActual, setClienteActual] = useState(null);

  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const isAdmin = currentUser?.role !== 'EMPLEADO';
  const permisosModulo = currentUser?.permisos?.clientes || {};

  const puedeCrear = isAdmin || permisosModulo.crear;
  const puedeEditar = isAdmin || permisosModulo.editar;
  const puedeEliminar = isAdmin || permisosModulo.eliminar;

  const cargarClientes = async () => {
    if (!token) { setError('No hay sesión activa'); return; }
    setError('');
    setCargando(true);
    try {
      const res = await fetch('https://atempo.onrender.com/api/clientes-frecuentes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudieron cargar los clientes');
      setClientes(data.data || []);
    } catch (e) {
      setError(e.message || 'Error al cargar');
      setClientes([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const abrirCrear = () => {
    setModo('crear');
    setClienteActual(null);
    setMostrarModal(true);
  };

  const abrirEditar = (cliente) => {
    setModo('editar');
    setClienteActual({
      id: cliente.id,
      nombre: cliente.nombre,
      email: (cliente.correo || cliente.email || '').toLowerCase(),
      celular: cliente.celular
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    cargarClientes();
  };

  const abrirConfirmar = (cliente) => {
    setClienteAEliminar(cliente);
    setMostrarConfirm(true);
  };

  const cerrarConfirmar = () => {
    setClienteAEliminar(null);
    setMostrarConfirm(false);
  };

  const confirmarEliminar = async () => {
    if (!token || !clienteAEliminar?.id) return;
    setEliminando(true);
    setError('');
    try {
      const res = await fetch(`https://atempo.onrender.com/api/clientes-frecuentes/${clienteAEliminar.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo eliminar');
      setClientes((prev) => prev.filter(c => c.id !== clienteAEliminar.id));
      cerrarConfirmar();
    } catch (e) {
      setError(e.message || 'Error al eliminar');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="clientes-container">
      <div className="header-clientes">
        <h2 className="titulo-clientes">Clientes frecuentes</h2>

        {puedeCrear && (
          <button className="nuevo-cliente-btn" onClick={abrirCrear}>
            Nuevo cliente frecuente <FaUserPlus className="icono-btn" />
          </button>
        )}
      </div>

      {error && <div className="alert error" role="alert" style={{marginBottom: 12}}>{error}</div>}

      {cargando ? (
        <div style={{ padding: 16 }}>Cargando…</div>
      ) : clientes.length === 0 ? (
        <div className="estado-vacio">
          <p>No hay clientes frecuentes aún.</p>
          {puedeCrear && (
            <button className="nuevo-cliente-btn" onClick={abrirCrear}>
              Agregar cliente <FaUserPlus className="icono-btn" />
            </button>
          )}
        </div>
      ) : (
        <table className="tabla-clientes">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Número celular</th>
              {(puedeEditar || puedeEliminar) && <th>Opciones</th>}
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>
                  <span className="cell-wrap clamp-2-3">{cliente.nombre}</span>
                </td>
                <td>
                  <span className="cell-wrap clamp-2-3">{cliente.correo || cliente.email}</span>
                </td>
                <td>
                  <span className="cell-wrap">{cliente.celular}</span>
                </td>
                
                {(puedeEditar || puedeEliminar) && (
                  <td>
                    {puedeEditar && (
                      <FaEdit 
                        className="icono-editar" 
                        title="Editar" 
                        onClick={() => abrirEditar(cliente)} 
                      />
                    )}
                    {puedeEliminar && (
                      <FaTrash 
                        className="icono-borrar" 
                        title="Eliminar" 
                        onClick={() => abrirConfirmar(cliente)} 
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {mostrarModal && (
        <ModalNuevoClienteFrecuente
          modo={modo}
          cliente={clienteActual}
          onClose={cerrarModal}
        />
      )}

      {mostrarConfirm && (
        <ModalConfirmacion
          titulo="Eliminar cliente frecuente"
          mensaje={`¿Seguro que deseas eliminar a "${clienteAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
          textoCancelar="Cancelar"
          textoConfirmar={eliminando ? 'Eliminando…' : 'Eliminar'}
          onCancel={cerrarConfirmar}
          onConfirm={confirmarEliminar}
          disabled={eliminando}
        />
      )}
    </div>
  );
};

export default ClientesFrecuentes;