import { NavLink } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
};

/** ========= ICONOS SVG ========= **/
const Ico = ({ children }: { children: React.ReactNode }) => (
  <span className="side-ico" aria-hidden>{children}</span>
);

const IcoBurger = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
);
const IcoPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
);
const IcoTrash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zm3-9h2v8H9zm4 0h2v8h-2zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
);
const IcoEdit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.84z"/></svg>
);
const IcoDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2l4 4h-4zM8 13h8v2H8zm0 4h8v2H8zm0-8h5v2H8z"/></svg>
);
const IcoMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M15 6l-6 2l-6-2v13l6 2l6-2l6 2V8z"/></svg>
);
const IcoLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M14 7v-2H5v14h9v-2H7V7zm7 5l-4-4v3h-5v2h5v3z"/></svg>
);
/** ================================= **/

export default function Sidebar({ collapsed, onToggle, onLogout }: Props){
  // Detecta viewport móvil
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1024px)').matches;
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(max-width: 1024px)');
    const mqHandler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    setIsMobile(mql.matches);
    mql.addEventListener?.('change', mqHandler as any);

    const modalFlag = () => setIsModalOpen(document.body.classList.contains('modal-open'));
    modalFlag(); // estado inicial
    document.addEventListener('shown.bs.modal', modalFlag as any);
    document.addEventListener('hidden.bs.modal', modalFlag as any);

    return () => {
      mql.removeEventListener?.('change', mqHandler as any);
      document.removeEventListener('shown.bs.modal', modalFlag as any);
      document.removeEventListener('hidden.bs.modal', modalFlag as any);
    };
  }, []);

  // Cerrar al seleccionar una opción en móvil (UX tipo drawer)
  const handleNavClick = useCallback(() => {
    if (isMobile && !collapsed) onToggle();
  }, [isMobile, collapsed, onToggle]);

  const expanded = !collapsed;

  return (
    <>
      {isMobile && expanded && !isModalOpen && (
        <div
          onClick={onToggle}
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 1040,
          }}
        />
      )}

      <aside
        className={'sidebar' + (collapsed ? ' sidebar-collapsed' : '')}
        aria-label="Barra lateral"
        /* aria-expanded se quita del contenedor para cumplir a11y;
           el control accesible con aria-expanded es el botón de toggle */
        style={isMobile && expanded && !isModalOpen ? { zIndex: 1100 } : undefined}
      >
        <div className="side-header">
          <button
            className="btn side-toggle side-item"
            onClick={onToggle}
            title="Abrir/Cerrar menú"
            aria-controls="app-sidebar"
            aria-expanded={!collapsed}
          >
            <Ico><IcoBurger/></Ico>
            <span className="label">Menú</span>
          </button>
        </div>

        <div className="side-scroll" id="app-sidebar">
          <nav className="side-nav" onClick={handleNavClick}>
            <NavLink to="/crear" className="side-link side-item" title="Registro Punto de Venta">
              <Ico><IcoPlus/></Ico><span className="label">Registro</span>
            </NavLink>
            <NavLink to="/eliminar" className="side-link side-item" title="Baja de Punto de Venta">
              <Ico><IcoTrash/></Ico><span className="label">Baja</span>
            </NavLink>
            <NavLink to="/editar" className="side-link side-item" title="Modificación Punto de Venta">
              <Ico><IcoEdit/></Ico><span className="label">Modificación</span>
            </NavLink>
            <NavLink to="/reporte" className="side-link side-item" title="Sabana de Datos">
              <Ico><IcoDoc/></Ico><span className="label">Sabana de Datos</span>
            </NavLink>

            <div className="side-sep" />

            <NavLink to="/dashboard" className="side-link side-item" title="Dashboard">
              <Ico><IcoMap/></Ico><span className="label">Dashboard</span>
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-logout side-item" onClick={onLogout} title="Cerrar sesión">
            <Ico><IcoLogout/></Ico><span className="label">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
