import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import '../styles/login.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('https://atempo.onrender.com/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo verificar el correo.');
      }

      setSuccessMsg('Correo verificado correctamente. Ahora puedes iniciar sesión.');

      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card verify-card">
        <h1 className="login-title verify-title">Verificar correo</h1>

        <p className="login-subtitle verify-subtitle">
          Ingresa el código que enviamos a tu correo electrónico.
        </p>

        {errorMsg && <div className="alert error verify-alert">{errorMsg}</div>}
        {successMsg && <div className="alert success verify-alert">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="verify-form">
          <div className="input-group">
            <input
              type="email"
              className="login-input"
              placeholder=" "
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="floating-label-text">Correo electrónico</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              className="login-input"
              placeholder=" "
              required
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                setCode(v);
              }}
            />
            <label className="floating-label-text">Código de verificación</label>
          </div>

          <button className="login-button verify-button" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar correo'}
          </button>
        </form>

        <p className="login-footer verify-footer">
          ¿Ya verificaste?{' '}
          <Link to="/" className="login-link">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
