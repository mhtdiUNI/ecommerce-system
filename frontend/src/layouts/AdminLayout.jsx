import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getToken, getUserRole } from '../services/auth';
import { isAdminRole, resolveNavigation } from '../navigation/navigation';
import { LayoutDashboard, ClipboardList, BarChart2, FileText, LogOut } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

function AdminLayout() {
  const navigate = useNavigate();
  const role = getUserRole();
  const navigation = resolveNavigation(role, Boolean(getToken()));

  const navIcons = {
    dashboard: <LayoutDashboard size={15} />,
    'orders-management': <ClipboardList size={15} />,
    analytics: <BarChart2 size={15} />,
    reports: <FileText size={15} />,
    logout: <LogOut size={15} />
  };

  if (!isAdminRole(role)) {
    return <Navigate to="/" replace />;
  }

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <header className="header-root header-root-admin">
        <div className="header-inner">
          <div className="header-brand">
            <img className="header-logo" src={logoIcon} alt="iStore logo" />
            <span className="admin-badge">Admin</span>
          </div>

          <div className="header-actions">
            <p className="header-greeting">Management workspace</p>
            <nav className="header-nav admin-nav">
              {navigation.map((item) => {
                if (item.kind === 'button') {
                  return (
                    <button key={item.key} type="button" onClick={handleLogout} className="nav-link nav-link-button admin-logout-button">
                      <span className="nav-inline">
                        {navIcons[item.key]}
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-inline">
                      {navIcons[item.key]}
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p className="site-footer-copy muted text-sm">iStore © 2025</p>
      </footer>
    </div>
  );
}

export default AdminLayout;
