import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import authApi, { type AuthUser } from '../api/auth';

type LoginArgs    = { username: string; password: string };
type RegisterArgs = { username: string; password: string; displayName: string; zone: string };

type AuthContextValue = {
  user: AuthUser | null;
  booting: boolean; // evita redirecciones 
  login: (args: LoginArgs) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  register: (args: RegisterArgs) => Promise<{ ok: boolean; message?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Storage keys
const LS_USER = 'pv_user';
const LS_LAST = 'pv_lastActivity';

// ===TIEMPO DE INACTIVIDAD===
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutos
const ACTIVITY_WRITE_THROTTLE_MS = 15_000; // 15s

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);

  // Mantener referencia al timer de inactividad
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWriteRef = useRef<number>(0);

  // ------- helpers de persistencia -------
  const setUserPersist = useCallback((u: AuthUser) => {
    localStorage.setItem(LS_USER, JSON.stringify(u));
    // registramos última actividad al hacer login
    localStorage.setItem(LS_LAST, String(Date.now()));
  }, []);

  const clearPersist = useCallback(() => {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_LAST);
  }, []);

  const readUserPersist = useCallback((): AuthUser | null => {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as AuthUser; } catch { clearPersist(); return null; }
  }, [clearPersist]);

  const readLastActivity = useCallback((): number | null => {
    const raw = localStorage.getItem(LS_LAST);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, []);

  // ------- API público (callbacks estables) -------
  const doLogout = useCallback(() => {
    setUser(null);
    clearPersist();
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, [clearPersist]);

  const scheduleIdleLogout = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    const last = readLastActivity();
    const base = last ?? Date.now();
    const remain = base + INACTIVITY_TIMEOUT_MS - Date.now();
    const delay = Math.max(0, remain);
    idleTimer.current = setTimeout(() => {
      // si sigue inactivo cuando dispare, cerramos sesión
      doLogout();
    }, delay);
  }, [readLastActivity, doLogout]);

  const registerActivity = useCallback((force = false) => {
    // sólo si hay usuario logueado
    if (!localStorage.getItem(LS_USER)) return;

    const now = Date.now();
    if (!force && now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;

    lastWriteRef.current = now;
    localStorage.setItem(LS_LAST, String(now)); // otros tabs también lo verán
    scheduleIdleLogout();
  }, [scheduleIdleLogout]);

  const login = useCallback(async ({ username, password }: LoginArgs) => {
    const res = await authApi.login({ username, password });
    if (res.success && res.user) {
      setUser(res.user);
      setUserPersist(res.user);
      // Forzar registro inicial para arrancar el contador
      registerActivity(true);
      return { ok: true };
    }
    return { ok: false, message: res.message ?? 'Usuario o contraseña inválidos.' };
  }, [registerActivity, setUserPersist]);

  const logout = useCallback(() => {
    doLogout();
  }, [doLogout]);

  const register = useCallback(async (args: RegisterArgs) => {
    const res = await authApi.register(args);
    return { ok: res.success, message: res.message };
  }, []);

  // ------- ciclo de vida -------
  useEffect(() => {
    const u = readUserPersist();
    if (u) {
      setUser(u);
      // si al cargar ya está inactivo, cerrar; si no, programar timer
      const last = readLastActivity();
      const inactive = last ? (Date.now() - last > INACTIVITY_TIMEOUT_MS) : false;
      if (inactive) {
        clearPersist();
        setUser(null);
      } else {
        scheduleIdleLogout();
      }
    }
    setBooting(false);
  }, [readUserPersist, readLastActivity, clearPersist, scheduleIdleLogout]);

  // Renovar actividad con eventos del usuario
  useEffect(() => {
    const handler = () => registerActivity(false);
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    window.addEventListener('mousemove', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mousemove', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [registerActivity]);

  // Sincronizar entre pestañas: cambios en usuario o actividad
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_USER) {
        setUser(readUserPersist());
        // al iniciar/cerrar en otra pestaña, reprogramar
        scheduleIdleLogout();
      } else if (e.key === LS_LAST) {
        // otra pestaña registró actividad → reprogramamos
        scheduleIdleLogout();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [readUserPersist, scheduleIdleLogout]);

  const value = useMemo(
    () => ({ user, booting, login, logout, register }),
    [user, booting, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
