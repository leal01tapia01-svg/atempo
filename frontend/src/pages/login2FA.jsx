import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const Login2FA = () => {
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
      const res = await fetch('https://atempo.onrender.com/api/auth/login/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo verificar el código.');
      }

      const { token, user, needsOnboarding } = data.data || {};

      if (!token || !user) {
        throw new Error('Respuesta inválida del servidor.');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setSuccessMsg('Código verificado correctamente. Iniciando sesión...');

      setTimeout(() => {
        if (needsOnboarding) {
          navigate('/nuevos-empleados');
        } else {
          navigate('/agenda-diaria');
        }
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Error al verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card verify-card">
        <h1 className="login-title verify-title">Código de seguridad</h1>
        <p className="login-subtitle verify-subtitle">
          Ingresa el código que enviamos a tu correo para completar el inicio de sesión.
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
            <label className="floating-label-text">Código de seguridad</label>
          </div>

          <button className="login-button verify-button" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Confirmar código'}
          </button>
        </form>

        <p className="login-footer verify-footer">
          ¿Quieres intentar de nuevo?{' '}
          <Link to="/" className="login-link">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login2FA;
