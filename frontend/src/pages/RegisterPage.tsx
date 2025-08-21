import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/auth';

export default function RegisterPage(){
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    zone: 'Naucalpan',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form | 'general', string>>>({});
  const [loading, setLoading] = useState(false);
  const [anim, setAnim] = useState('animate__fadeInUp');

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if(!form.username.trim()) e.username = 'Usuario requerido.';
    if(!form.displayName.trim()) e.displayName = 'Nombre a mostrar requerido.';
    if(!form.zone.trim()) e.zone = 'Zona requerida.';
    if(!form.password) e.password = 'Contraseña requerida.';
    else if(form.password.length < 8) e.password = 'Mínimo 8 caracteres.';
    if(form.confirm !== form.password) e.confirm = 'Las contraseñas no coinciden.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!validate()){
      setAnim('animate__shakeX'); setTimeout(()=>setAnim('animate__fadeInUp'), 700);
      return;
    }

    try{
      setLoading(true);
      const res = await authApi.register({
        username: form.username.trim(),
        displayName: form.displayName.trim(),
        zone: form.zone.trim(),
        password: form.password
      });
      if(!res.success){
        setErrors({ general: res.message || 'No fue posible registrar el usuario.' });
        setAnim('animate__shakeX'); setTimeout(()=>setAnim('animate__fadeInUp'), 700);
        return;
      }
      // Registro exitoso: ir a Login
      nav('/login', { replace: true });
    }catch{
      setErrors({ general: 'Error al registrar. Intenta más tarde.' });
      setAnim('animate__shakeX'); setTimeout(()=>setAnim('animate__fadeInUp'), 700);
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className={`auth-card animate__animated ${anim}`}>
        <h3 className="auth-title">Crear cuenta</h3>
        <p className="auth-sub">Completa los datos para registrarte.</p>

        {errors.general && (<div className="alert alert-danger py-2">{errors.general}</div>)}

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              name="username" value={form.username} onChange={onChange}
              autoComplete="username"
            />
            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Nombre a mostrar</label>
            <input
              className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
              name="displayName" value={form.displayName} onChange={onChange}
            />
            {errors.displayName && <div className="invalid-feedback">{errors.displayName}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Zona</label>
            <input
              className={`form-control ${errors.zone ? 'is-invalid' : ''}`}
              name="zone" value={form.zone} onChange={onChange}
            />
            {errors.zone && <div className="invalid-feedback">{errors.zone}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              name="password" value={form.password} onChange={onChange}
              autoComplete="new-password"
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            <div className="form-text">Mínimo 8 caracteres.</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Confirmar contraseña</label>
            <input
              type="password"
              className={`form-control ${errors.confirm ? 'is-invalid' : ''}`}
              name="confirm" value={form.confirm} onChange={onChange}
              autoComplete="new-password"
            />
            {errors.confirm && <div className="invalid-feedback">{errors.confirm}</div>}
          </div>

          <button className="btn btn-primary w-100" disabled={loading} type="submit">
            {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
            Registrarme
          </button>
        </form>

        <div className="mt-3 small">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
