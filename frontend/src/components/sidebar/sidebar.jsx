import React, { useState, useEffect } from 'react';
import './sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaCalendarDay, FaCalendarWeek, FaPlus, FaUsers, 
  FaStar, FaSignOutAlt, FaUserCog, FaShieldAlt 
} from 'react-icons/fa';
import logo from '../../assets/LogoAtempoPNG.png';

const Sidebar = ({ onAbrirModal, modalActivo }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  const esDueno = user.role !== 'EMPLEADO'; 
  const p = user.permisos || {}; 
  const verCitas = esDueno || (p.citas?.crear || p.citas?.editar || p.citas?.eliminar);
  const puedeAgendar = esDueno || p.citas?.crear;
  const verEmpleados = esDueno || (p.empleados?.crear || p.empleados?.editar || p.empleados?.eliminar);
  const verClientes = esDueno || (p.clientes?.crear || p.clientes?.editar || p.clientes?.eliminar);
  const verRolesYPermisos = esDueno; 

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src={logo} alt="Logo Atempo" className="logo" onError={(e) => e.target.style.display='none'} />
        <h2 className="brand-name">Atempo</h2>
      </div>

      <nav className="menu">
        {verCitas && (
          <>
            <NavLink to="/agenda-diaria" className={({ isActive }) => (isActive && modalActivo !== 'cita' ? 'active' : '')}>
              <FaCalendarDay className="icon" />
              Agenda diaria
            </NavLink>
            <NavLink to="/agenda-semanal" className={({ isActive }) => (isActive && modalActivo !== 'cita' ? 'active' : '')}>
              <FaCalendarWeek className="icon" />
              Agenda semanal
            </NavLink>
          </>
        )}

        {puedeAgendar && (
          <button
            onClick={() => onAbrirModal('cita')}
            className={`menu-btn ${modalActivo === 'cita' ? 'active' : ''}`}
          >
            <FaPlus className="icon" />
            Agendar cita
          </button>
        )}

        {verEmpleados && (
          <NavLink to="/empleados" className={({ isActive }) => (isActive && modalActivo !== 'cita' ? 'active' : '')}>
            <FaUsers className="icon" />
            Empleados
          </NavLink>
        )}

        {verClientes && (
          <NavLink to="/clientes-frecuentes" className={({ isActive }) => (isActive && modalActivo !== 'cita' ? 'active' : '')}>
            <FaStar className="icon" />
            Clientes frecuentes
          </NavLink>
        )}

        {verRolesYPermisos && (
          <NavLink to="/roles-permisos" className={({ isActive }) => (isActive && modalActivo !== 'cita' ? 'active' : '')}>
            <FaShieldAlt className="icon" />
            Roles y Permisos
          </NavLink>
        )}

        <NavLink to="/mi-perfil" className={({ isActive }) => (isActive && modalActivo !== 'cita' ? 'active' : '')}>
          <FaUserCog className="icon" />
          Mi perfil
        </NavLink>
      </nav>

      <button className="logout-btn logout-menu-btn" onClick={handleLogout}>
        <FaSignOutAlt className="icon logout-icon" />
        Cerrar sesión
      </button>
    </aside>
  );
};

export default Sidebar;