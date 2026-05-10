import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Home, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Header = () => {
  return (
    <header className="app-header" style={{ justifyContent: 'center' }}>
      <div className="logo-title" style={{ margin: 0 }}>Indium.</div>
    </header>
  );
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'assets', label: 'ASSETS', icon: Wallet, path: '/assets' },
    { id: 'hub', label: 'HUB', icon: Home, path: '/hub' },
    { id: 'rewards', label: 'REWARDS', icon: Gift, path: '/rewards' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '');
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="nav-icon-wrapper">
              <Icon size={20} className="nav-icon" />
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const Layout = () => {
  const { user, loading, isMockMode } = useAuth();
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p style={{ fontWeight: 'bold', color: '#64748b' }}>Initializing Indium...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      {isMockMode && (
        <div style={{ 
          backgroundColor: '#ef4444', 
          color: 'white', 
          padding: '12px 16px', 
          fontSize: '13px', 
          fontWeight: '800', 
          textAlign: 'center',
          borderBottom: '4px solid #b91c1c',
          letterSpacing: '1px',
          animation: 'pulse 2s infinite',
          zIndex: 9999,
          position: 'relative'
        }}>
          ⚠️ OFFLINE DEMO MODE ⚠️<br/>
          <span style={{ fontSize: '10px', fontWeight: '400' }}>
            Supabase is not connected. Your data WILL NOT PERSIST on refresh. 
            Check your Netlify Environment Variables.
          </span>
        </div>
      )}
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
