import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/login.css';
import logo from '../assets/LogoAtempoPNG.png';
import avatar from '../assets/avatar.png';
import { FaUpload } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    business: '',
    owner: '',
    ownerLast: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo seleccionado no es una imagen válida.');
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('El tamaño máximo del logo es 2MB.');
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    setErrorMsg('');
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (form.password !== form.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (!logoFile) {
      setErrorMsg('Por favor, sube el logo del negocio (Máx 2MB).');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('negocioNombre', form.business.trim());
      fd.append('duenoNombres', form.owner.trim());
      fd.append('duenoApellidos', form.ownerLast.trim());
      fd.append('celular', form.phone.trim());
      fd.append('email', form.email.trim());
      fd.append('password', form.password);
      fd.append('logo', logoFile);

      const res = await fetch(`https://biological-ariel-atempo-05d801c3.koyeb.app/api/auth/register`, {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo registrar.');
      }

      setSuccessMsg('Te enviamos un código a tu correo para verificarlo.');

      setTimeout(() => {
          navigate('/verificar-correo', { state: { email: form.email } });
      }, 1500);
      
    } catch (err) {
      setErrorMsg(err.message || 'Error de red.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Atempo logo" className="login-logo" />
        <h1 className="login-title">Atempo</h1>
        <h2 className="login-subtitle">Registrar cuenta</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="register-avatar-section" aria-label="Logo del negocio">
            <label className="register-avatar-label">Logo del negocio (Máx 2MB)</label>

            <img
              src={logoPreview || avatar}
              alt="Logo del negocio"
              className="register-avatar-owner"
              onError={(e) => { e.currentTarget.src = avatar; }}
            />

            <button
              type="button"
              className="register-upload-btn"
              onClick={handleOpenFileDialog}
              disabled={submitting}
            >
              <FaUpload className="register-upload-icon" />
              {logoFile ? 'Cambiar logo' : 'Cargar logo'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              id="business"
              name="business"
              className="login-input"
              placeholder=" "
              required
              maxLength={70}
              value={form.business}
              onChange={onChange}
            />
            <label htmlFor="business" className="floating-label-text">Nombre del negocio</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              id="owner"
              name="owner"
              className="login-input"
              placeholder=" "
              required
              maxLength={70}
              value={form.owner}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
                onChange(e);
              }}
              title="Solo letras y espacios"
            />
            <label htmlFor="owner" className="floating-label-text">Nombre(s) del dueño</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              id="ownerLast"
              name="ownerLast"
              className="login-input"
              placeholder=" "
              required
              maxLength={70}
              value={form.ownerLast}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
                onChange(e);
              }}
              title="Solo letras y espacios"
            />
            <label htmlFor="ownerLast" className="floating-label-text">Apellidos del dueño</label>
          </div>

          <div className="input-group">
            <input
              type="tel"
              id="phone"
              name="phone"
              className="login-input"
              placeholder=" "
              required
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                onChange(e);
              }}
            />
            <label htmlFor="phone" className="floating-label-text">Número de celular</label>
          </div>

          <div className="input-group">
            <input
              type="email"
              id="email"
              name="email"
              className="login-input"
              placeholder=" "
              required
              maxLength={100}
              value={form.email}
              onChange={onChange}
            />
            <label htmlFor="email" className="floating-label-text">Correo electrónico</label>
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              className="login-input"
              placeholder=" "
              required
              maxLength={20}
              pattern=".{6,20}"
              title="Debe tener entre 6 y 20 caracteres"
              value={form.password}
              onChange={onChange}
            />
            <label htmlFor="password" className="floating-label-text">Contraseña</label>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          <div className="input-group password-group">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              className="login-input"
              placeholder=" "
              required
              maxLength={20}
              pattern=".{6,20}"
              title="Debe tener entre 6 y 20 caracteres"
              value={form.confirmPassword}
              onChange={onChange}
            />
            <label htmlFor="confirmPassword" className="floating-label-text">Confirmar contraseña</label>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {successMsg && <div className="alert success" role="status">{successMsg}</div>}

          {errorMsg && (
            <div 
              className="alert error" 
              role="alert" 
              style={{ color: '#d32f2f', fontWeight: '500', marginBottom: '1rem', textAlign: 'center' }}
            >
              {errorMsg}
            </div>
          )}

          <button className="login-button" type="submit" disabled={submitting}>
            {submitting ? 'Registrando...' : 'Registrar cuenta'}
          </button>
        </form>

        <p className="login-footer">
          ¿Ya tienes cuenta? <Link to="/" className="login-link">Inicia sesión</Link>
        </p>

        <p className="login-legal">
          Protegemos tu información conforme a nuestro{' '}
          <Link to="/aviso-privacidad" className="login-link" aria-label="Abrir aviso de privacidad">
            Aviso de Privacidad
          </Link>.
        </p>
      </div>
    </div>
  );
};

export default Register;