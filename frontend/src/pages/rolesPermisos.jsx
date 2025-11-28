import React, { useState, useEffect } from 'react';
import '../styles/rolesPermisos.css';

const permisosDefault = {
  citas: { crear: false, editar: false, eliminar: false },
  empleados: { crear: false, editar: false, eliminar: false },
  clientes: { crear: false, editar: false, eliminar: false },
};

const RolesPermisos = () => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [permisos, setPermisos] = useState(permisosDefault);

  useEffect(() => {
    const obtenerEmpleados = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/empleados', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.ok) {
          setEmpleados(result.data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    obtenerEmpleados();
  }, []);

  useEffect(() => {
    if (!empleadoSeleccionado) {
      setPermisos(permisosDefault);
      return;
    }

    const empleadoEncontrado = empleados.find(e => e.id === empleadoSeleccionado);
    
    if (empleadoEncontrado && empleadoEncontrado.permisos) {
      setPermisos(empleadoEncontrado.permisos);
    } else {
      setPermisos(permisosDefault);
    }
  }, [empleadoSeleccionado, empleados]);

  const handleCheckboxChange = (modulo, accion) => {
    setPermisos((prev) => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [accion]: !prev[modulo][accion],
      },
    }));
  };

  const handleGuardar = async () => {
    if (!empleadoSeleccionado) {
      alert('Por favor, selecciona un empleado primero.');
      return;
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empleados/${empleadoSeleccionado}/permisos`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(permisos)
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        alert('Permisos guardados exitosamente.');
        setEmpleados(prev => prev.map(emp => 
          emp.id === empleadoSeleccionado 
            ? { ...emp, permisos: result.data.permisos } 
            : emp
        ));
      } else {
        alert('Error al guardar: ' + (result.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="roles-container">
      <div className="roles-content-wrapper">
        <div className="card-panel">
          <div className="card-header">
            <h3>Configuración de Accesos</h3>
            <p className="text-muted">Asigna permisos específicos por empleado.</p>

            <p style={{ fontSize: '0.85rem', color: '#1976d2', marginTop: '8px', backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '4px' }}>
              Nota: La contraseña por defecto para nuevos empleados es "<strong>empleado</strong>".
            </p>
          </div>

          <div className="selector-container">
            <label htmlFor="empleado-select" className="selector-label">Seleccionar Empleado:</label>
            <select 
              id="empleado-select"
              className="empleado-select"
              value={empleadoSeleccionado}
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
            >
              <option value="">-- Elige un empleado --</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombres} {emp.apellidos}
                </option>
              ))}
            </select>
          </div>

          {empleadoSeleccionado && (
            <>
              <div className="table-responsive">
                <table className="permissions-table">
                  <thead>
                    <tr>
                      <th className="col-modulo">Módulo</th>
                      <th className="text-center">Crear</th>
                      <th className="text-center">Editar</th>
                      <th className="text-center">Modificar / Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-bold">Citas</td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.citas?.crear || false} 
                          onChange={() => handleCheckboxChange('citas', 'crear')} 
                        />
                      </td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.citas?.editar || false} 
                          onChange={() => handleCheckboxChange('citas', 'editar')} 
                        />
                      </td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.citas?.eliminar || false} 
                          onChange={() => handleCheckboxChange('citas', 'eliminar')} 
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="fw-bold">Empleados</td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.empleados?.crear || false} 
                          onChange={() => handleCheckboxChange('empleados', 'crear')} 
                        />
                      </td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.empleados?.editar || false} 
                          onChange={() => handleCheckboxChange('empleados', 'editar')} 
                        />
                      </td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.empleados?.eliminar || false} 
                          onChange={() => handleCheckboxChange('empleados', 'eliminar')} 
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="fw-bold">Clientes Frecuentes</td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.clientes?.crear || false} 
                          onChange={() => handleCheckboxChange('clientes', 'crear')} 
                        />
                      </td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.clientes?.editar || false} 
                          onChange={() => handleCheckboxChange('clientes', 'editar')} 
                        />
                      </td>
                      <td className="text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={permisos.clientes?.eliminar || false} 
                          onChange={() => handleCheckboxChange('clientes', 'eliminar')} 
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card-footer">
                <button 
                  className="btn-save" 
                  onClick={handleGuardar}
                  disabled={guardando}
                  style={{ opacity: guardando ? 0.7 : 1 }}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesPermisos;