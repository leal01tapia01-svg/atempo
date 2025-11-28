import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/miPerfil.css';
import avatar from '../assets/avatar.png';
import { FaUpload } from 'react-icons/fa';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MiPerfil = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // --- LÓGICA DE ROLES ---
  const isEmployee = currentUser?.role === 'EMPLEADO';
  // -----------------------

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [negocio, setNegocio] = useState({ nombre: '' });
  const [datos, setDatos] = useState({
    owner: '',
    ownerLast: '',
    phone: '',
    email: '',
  });
  const [passwords, setPasswords] = useState({ actual: '', nueva: '' });

  const [logoUrl, setLogoUrl] = useState('');
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setErr('');
        const res = await fetch('https://biological-ariel-atempo-05d801c3.koyeb.app/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo cargar el perfil');

        const u = data.data;
        setNegocio({ nombre: u.negocioNombre || '' });
        setDatos({
          owner: u.duenoNombres || '',
          ownerLast: u.duenoApellidos || '',
          phone: u.celular || '',
          email: u.email || '',
        });
        setLogoUrl(u.logoUrl || '');
      } catch (e) {
        setErr(e.message || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleNegocio = (e) => {
    const { name, value } = e.target;
    setNegocio((p) => ({ ...p, [name]: value }));
  };
  const handleDatos = (e) => {
    const { name, value } = e.target;
    setDatos((p) => ({ ...p, [name]: value }));
  };
  const handlePasswords = (e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
  };

  const saveBusiness = async () => {
    if (isEmployee) return; // Seguridad extra en frontend
    if (!negocio.nombre.trim()) { setErr('El nombre del negocio es obligatorio'); return; }
    setSavingBusiness(true);
    setErr('');
    try {
      const res = await fetch('https://biological-ariel-atempo-05d801c3.koyeb.app/api/auth/profile/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ negocioNombre: negocio.nombre.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo guardar');
      
      // Actualizar localStorage para que el Header se refresque si es necesario
      if (currentUser) {
        currentUser.negocioNombre = negocio.nombre.trim();
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      alert('Información del negocio actualizada');
    } catch (e) {
      setErr(e.message || 'Error al guardar');
    } finally {
      setSavingBusiness(false);
    }
  };

  const savePersonal = async () => {
    if (!datos.owner.trim()) return setErr('El nombre es obligatorio');
    if (!datos.ownerLast.trim()) return setErr('Los apellidos son obligatorios');
    if (!/^\d{10,15}$/.test(datos.phone.trim())) return setErr('El celular debe tener 10–15 dígitos');
    if (!EMAIL_RE.test(datos.email.trim())) return setErr('Correo inválido');

    setSavingPersonal(true);
    setErr('');
    try {
      const res = await fetch('https://biological-ariel-atempo-05d801c3.koyeb.app/api/auth/profile/personal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          duenoNombres: datos.owner.trim(),
          duenoApellidos: datos.ownerLast.trim(),
          celular: datos.phone.trim(),
          email: datos.email.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo guardar');
      
      // Actualizar localStorage
      if (currentUser) {
        currentUser.nombres = datos.owner.trim();
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      alert('Datos personales actualizados');
    } catch (e) {
      setErr(e.message || 'Error al guardar');
    } finally {
      setSavingPersonal(false);
    }
  };

  const changePassword = async () => {
    if (!passwords.actual) return setErr('Debes ingresar la contraseña actual');
    if (!passwords.nueva || passwords.nueva.length < 6) return setErr('La nueva contraseña debe tener 6+ caracteres');

    setSavingPwd(true);
    setErr('');
    try {
      const res = await fetch('https://biological-ariel-atempo-05d801c3.koyeb.app/api/auth/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actual: passwords.actual,
          nueva: passwords.nueva,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo cambiar la contraseña');
      
      setPasswords({ actual: '', nueva: '' });
      alert('Contraseña actualizada correctamente');
    } catch (e) {
      setErr(e.message || 'Error al cambiar la contraseña');
    } finally {
      setSavingPwd(false);
    }
  };

  const pickLogo = async (e) => {
    if (isEmployee) return; // Empleados no cambian logo
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErr('Solo PNG, JPG, JPEG o WEBP'); return;
    }
    if (file.size > 2 * 1024 * 1024) { setErr('El archivo supera 2MB'); return; }

    setSavingLogo(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch('https://biological-ariel-atempo-05d801c3.koyeb.app/api/auth/profile/logo', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'No se pudo actualizar el logo');
      
      setLogoUrl(data.data.logoUrl || '');
      // Actualizar localStorage para el Header
      if (currentUser) {
        currentUser.logoUrl = data.data.logoUrl;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (e) {
      setErr(e.message || 'Error al subir el logo');
    } finally {
      setSavingLogo(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="perfil-container">Cargando…</div>;

  return (
    <div className="perfil-container">
      {err && <div className="alert error" role="alert" style={{ marginBottom: 12 }}>{err}</div>}

      {/* Información del negocio - BLOQUEADO PARA EMPLEADOS */}
      <section className="perfil-section">
        <h3 className="perfil-section-title">Información del negocio</h3>

        <div className="perfil-grid-2 perfil-negocio-center">
          <div className="perfil-avatar-block" aria-label="Logo del negocio">
            <label className="perfil-avatar-label">Logo del negocio</label>
            <img
              src={logoUrl || avatar}
              alt="Logo del negocio"
              className="perfil-avatar"
              onError={(e) => { e.currentTarget.src = avatar; }}
            />

            {/* Solo el dueño puede ver el botón de cargar logo */}
            {!isEmployee && (
              <label className={`perfil-upload-btn ${savingLogo ? 'disabled' : ''}`}>
                <FaUpload className="perfil-upload-icon" />
                {savingLogo ? 'Subiendo…' : 'Cargar logo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  style={{ display: 'none' }}
                  onChange={pickLogo}
                  disabled={savingLogo}
                />
              </label>
            )}
          </div>

          <div className="perfil-field">
            <label>Nombre del negocio *</label>
            <input
              type="text"
              name="nombre"
              placeholder="Escribe el nombre de tu negocio"
              value={negocio.nombre}
              onChange={handleNegocio}
              maxLength={70}
              // Deshabilitar si es empleado
              disabled={savingBusiness || isEmployee}
              style={isEmployee ? { backgroundColor: '#f3f4f6', color: '#777' } : {}}
            />
          </div>
        </div>

        {!isEmployee && (
          <div className="perfil-actions">
            <button className="perfil-btn-primary" onClick={saveBusiness} disabled={savingBusiness}>
              {savingBusiness ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </section>

      {/* Datos personales - HABILITADO PARA AMBOS, PERO CON LOGICA DIFERENTE */}
      <section className="perfil-section">
        <h3 className="perfil-section-title">Datos personales</h3>

        <div className="perfil-grid-2">
          <div className="perfil-field">
            {/* Etiqueta genérica */}
            <label>Nombre(s) *</label> 
            <input
              type="text"
              name="owner"
              placeholder="Tus nombres"
              value={datos.owner}
              onChange={handleDatos}
              maxLength={70}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
              }}
              disabled={savingPersonal}
            />
          </div>

          <div className="perfil-field">
            {/* Etiqueta genérica */}
            <label>Apellidos *</label>
            <input
              type="text"
              name="ownerLast"
              placeholder="Tus apellidos"
              value={datos.ownerLast}
              onChange={handleDatos}
              maxLength={70}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
              }}
              disabled={savingPersonal}
            />
          </div>

          <div className="perfil-field">
            <label>Número de celular *</label>
            <input
              type="tel"
              name="phone"
              placeholder="10–15 dígitos"
              value={datos.phone}
              onChange={handleDatos}
              inputMode="numeric"
              maxLength={15}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
              }}
              disabled={savingPersonal}
            />
          </div>

          <div className="perfil-field">
            <label>Correo electrónico *</label>
            <input
              type="email"
              name="email"
              placeholder="correo@dominio.com"
              value={datos.email}
              onChange={handleDatos}
              maxLength={100}
              disabled={savingPersonal}
            />
          </div>
        </div>

        <div className="perfil-actions">
          <button className="perfil-btn-primary" onClick={savePersonal} disabled={savingPersonal}>
            {savingPersonal ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </section>

      {/* Contraseña - HABILITADO PARA AMBOS */}
      <section className="perfil-section">
        <h3 className="perfil-section-title">Contraseña</h3>

        <div className="perfil-grid-2">
          <div className="perfil-field">
            <label>Contraseña actual</label>
            <input
              type="password"
              name="actual"
              placeholder="••••••"
              value={passwords.actual}
              onChange={handlePasswords}
              maxLength={20}
              disabled={savingPwd}
            />
          </div>

          <div className="perfil-field">
            <label>Nueva contraseña</label>
            <input
              type="password"
              name="nueva"
              placeholder="6–20 caracteres"
              value={passwords.nueva}
              onChange={handlePasswords}
              maxLength={20}
              pattern=".{6,20}"
              title="Debe tener entre 6 y 20 caracteres"
              disabled={savingPwd}
            />
          </div>
        </div>

        <div className="perfil-actions">
          <button className="perfil-btn-primary" onClick={changePassword} disabled={savingPwd}>
            {savingPwd ? 'Cambiando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </section>

      {/* Suscripción - VISIBLE SOLO PARA EL DUEÑO (Opcional, pero recomendado) */}
      {!isEmployee && (
        <section className="perfil-section">
          <h3 className="perfil-section-title">Suscripción</h3>

          <div className="perfil-sub-grid">
            <div className="perfil-sub-item">
              <span className="perfil-sub-label">Plan actual:</span>
              <span className="perfil-sub-value">Pro</span>
            </div>
            <div className="perfil-sub-item">
              <span className="perfil-sub-label">Caduca:</span>
              <span className="perfil-sub-value">10 de noviembre del 2025</span>
            </div>
          </div>

          <div className="perfil-actions">
            <button className="perfil-btn-outline" onClick={() => navigate('/planes')}>
              Cambiar plan
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default MiPerfil;