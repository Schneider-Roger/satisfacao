import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Settings, LogOut, Users, Headphones } from 'lucide-react';
import logoHorizontal from '../assets/logos/Copercana_Horizontal-bco.png';
import { AuthContext } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['admin', 'user'] },
    { path: '/admin/respostas', icon: <MessageSquare size={20} />, label: 'Respostas', roles: ['admin', 'user'] },
    { path: '/admin/ouvidoria', icon: <Headphones size={20} />, label: 'Ouvidoria', roles: ['admin', 'user'] },
    { path: '/admin/usuarios', icon: <Users size={20} />, label: 'Usuários', roles: ['admin'] },
    { path: '/admin/configuracoes', icon: <Settings size={20} />, label: 'Configurações', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={logoHorizontal} alt="Copercana" style={{ height: '40px' }} />
        </div>
        
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {filteredNavItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem',
                color: 'white', textDecoration: 'none',
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderLeft: location.pathname === item.path ? '4px solid var(--color-star-filled)' : '4px solid transparent'
              }}
            >
              {item.icon}
              <span style={{ fontWeight: 500 }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', 
              background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', padding: '0.5rem' 
            }}
          >
            <LogOut size={20} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{user ? user.name : 'Carregando...'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              {user ? user.name.substring(0, 2).toUpperCase() : 'CO'}
            </div>
          </div>
        </header>
        
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
