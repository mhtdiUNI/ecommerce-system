import { Link, Navigate, Outlet } from 'react-router-dom';
import { getToken, getUserRole } from '../services/auth';
import { isAdminRole } from '../navigation/navigation';
import logoIcon from '../assets/logo-icon.png';

function AuthLayout() {
  const token = getToken();
  const role = getUserRole();

  if (!token) {
    return (
      <div>
        <header className="header-root">
          <div className="header-inner">
            <Link to="/" className="header-brand">
              <img className="header-logo" src={logoIcon} alt="iStore logo" />
              <h1>iStore</h1>
            </Link>
          </div>
        </header>

        <main>
          <Outlet />
        </main>

        <footer className="site-footer">
          <p className="site-footer-copy">iStore © 2025</p>
        </footer>
      </div>
    );
  }

  if (isAdminRole(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

export default AuthLayout;
