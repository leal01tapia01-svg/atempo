import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";
import logo from "../assets/LogoAtempoPNG.png";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Ingresa tu correo y contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("https://biological-ariel-atempo-05d801c3.koyeb.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Correo o contraseña incorrectos.");
      }

      if (data.step === "2fa") {
        navigate("/login-2fa", { state: { email: email.trim() } });
        return;
      }

      const { token, user, needsOnboarding } = data.data || {};

      if (!token || !user) {
        throw new Error("Respuesta inválida del servidor.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (needsOnboarding) {
        navigate("/nuevos-empleados");
      } else {
        navigate("/agenda-diaria");
      }
    } catch (err) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Atempo logo" className="login-logo" />
        <h1 className="login-title">Atempo</h1>
        <h2 className="login-subtitle">Iniciar sesión</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <input
              type="email"
              id="email"
              name="email"
              className="login-input"
              placeholder=" "
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={100}
            />
            <label htmlFor="email" className="floating-label-text">
              Correo electrónico
            </label>
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="login-input"
              placeholder=" "
              required
              autoComplete="off"
              maxLength={20}
              pattern=".{6,20}"
              title="Debe tener entre 6 y 20 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="password" className="floating-label-text">
              Contraseña
            </label>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {errorMsg && (
            <div
              className="alert error"
              role="alert"
              style={{
                color: "#d32f2f",
                fontWeight: "500",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              {errorMsg}
            </div>
          )}

          <button className="login-button" type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="login-footer">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="login-link">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;