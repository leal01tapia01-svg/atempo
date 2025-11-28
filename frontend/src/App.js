import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./pages/login"
import Register from "./pages/register";
import RegisterEmployees from "./pages/registerEmployees";
import AppLayout from "./components/layouts/appLayout";
import AgendaDiaria from "./pages/agendaDiaria";
import AgendaSemanal from "./pages/agendaSemanal";
import Empleados from "./pages/empleados";
import ClientesFrecuentes from "./pages/clientesFrecuentes";
import AvisoDePrivacidad from "./pages/avisoDePrivacidad";
import MiPerfil from "./pages/miPerfil";
import Planes from "./pages/planes";
import VerifyEmail from './pages/verifyEmail';
import Login2FA from './pages/login2FA';
import RolesPermisos from './pages/rolesPermisos';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verificar-correo" element={<VerifyEmail />} />
        <Route path="/login-2fa" element={<Login2FA />} />
        <Route path="/aviso-privacidad" element={<AvisoDePrivacidad />} />

        <Route 
          path="/planes" 
          element={
            <ProtectedRoute>
              <Planes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nuevos-empleados" 
          element={
            <ProtectedRoute>
              <RegisterEmployees />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/agenda-diaria"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AgendaDiaria />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/agenda-semanal"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AgendaSemanal />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/empleados"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Empleados />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clientes-frecuentes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ClientesFrecuentes />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles-permisos"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RolesPermisos />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mi-perfil"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MiPerfil />
              </AppLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;