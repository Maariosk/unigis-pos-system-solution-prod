import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';
import DeletePage from './pages/DeletePage';
import EditPage from './pages/EditPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';

// Redirección inteligente para "/" y para "404"
function SmartRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? '/crear' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Público */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Raíz: decide según sesión */}
          <Route path="/" element={<SmartRedirect />} />

          {/* Protegido */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              {/* índice relativo -> a "crear" */}
              <Route index element={<Navigate to="crear" replace />} />
              <Route path="crear" element={<CreatePage />} />
              <Route path="eliminar" element={<DeletePage />} />
              <Route path="editar" element={<EditPage />} />
              <Route path="reporte" element={<ReportPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Route>

          {/* 404 inteligente */}
          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
