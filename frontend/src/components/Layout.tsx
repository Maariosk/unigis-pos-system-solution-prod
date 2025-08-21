import { Outlet, useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/layout.css';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function Layout(){
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const s = localStorage.getItem('pv_sidebar_collapsed');
    return s ? s === '1' : false;
  });
  useEffect(() => {
    localStorage.setItem('pv_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} onLogout={handleLogout} />
      <main className={'main' + (collapsed ? ' main-collapsed' : '')}>
        <TopBar userName={user?.displayName ?? user?.username ?? 'Invitado'} siteName={user?.zone ?? '—'} />
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
