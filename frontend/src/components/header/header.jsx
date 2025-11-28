import React, { useMemo } from 'react';
import './header.css';
import { FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const negocioNombre = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return 'Mi negocio';
      const u = JSON.parse(raw);
      return u?.negocioNombre || 'Mi negocio';
    } catch {
      return 'Mi negocio';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header className="top-header">
      <h1 className="business-name">{negocioNombre}</h1>
      <button className="logout-mobile-btn" onClick={handleLogout} title="Cerrar sesión">
        <FaSignOutAlt />
      </button>
    </header>
  );
};

export default Header;
