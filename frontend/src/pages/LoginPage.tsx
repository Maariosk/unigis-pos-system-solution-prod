import { useState } from 'react';
// import { Link } from 'react-router-dom'; // Registrar usuario nuevo
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage(){
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/crear';
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<{ username?:string; password?:string; general?:string }>({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if(!form.username.trim()) e.username = 'Ingresa tu usuario.';
    if(!form.password) e.password = 'Ingresa tu contraseña.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!validate()) return;
    try{
      setLoading(true);
      const { ok, message } = await login({ username: form.username.trim(), password: form.password });
      if (!ok) {
        setErrors({ general: message || 'Usuario o contraseña inválidos.' });
        setShake(true); setTimeout(()=>setShake(false), 700);
        return;
      }
      nav(from, { replace: true }); 
    } catch (err:any) {
      const apiMsg =
        err?.response?.data?.message ??
        (err?.code === 'ERR_NETWORK'
          ? 'No se pudo conectar con el servidor. Revisa la URL del API y CORS.'
          : err?.message);
      setErrors({ general: apiMsg || 'No se pudo iniciar sesión. Verifica tu conexión.' });
      setShake(true); setTimeout(()=>setShake(false), 700);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className={`auth-card animate__animated ${shake ? 'animate__shakeX' : 'animate__fadeInUp'}`}>
        <h3 className="auth-title">Iniciar Sesión</h3>
        <p className="auth-sub">Accede con tu usuario y contraseña.</p>

        {errors.general && (
          <div className="alert alert-danger py-2" role="alert">{errors.general}</div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              name="username"
              value={form.username}
              onChange={onChange}
              autoComplete="username"
            />
            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              name="password"
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <button className="btn btn-primary w-100" disabled={loading} type="submit">
            {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
            Entrar
          </button>
        </form>
        {/*
        <div className="mt-3 small">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </div>
        */}
      </div>
    </div>
  );
}
