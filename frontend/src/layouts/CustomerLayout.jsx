import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { clearToken, getToken, getUserName, getUserRole } from '../services/auth';
import { isAdminRole, resolveNavigation } from '../navigation/navigation';
import { Home, ShoppingBag, ShoppingCart, Package, MapPin, LogOut, LogIn, UserPlus } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

function CustomerLayout() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const role = getUserRole();
  const isSignedIn = Boolean(getToken());
  const userName = getUserName();
  const navigation = resolveNavigation(role, isSignedIn);

  const navIcons = {
    home: <Home size={15} />,
    products: <ShoppingBag size={15} />,
    cart: <ShoppingCart size={15} />,
    orders: <Package size={15} />,
    addresses: <MapPin size={15} />,
    logout: <LogOut size={15} />,
    login: <LogIn size={15} />,
    register: <UserPlus size={15} />
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCartCount() {
      if (!getToken()) {
        setCartCount(0);
        return;
      }

      try {
        const cartItems = await api.get('/cart');
        const count = Array.isArray(cartItems)
          ? cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          : 0;

        if (isMounted) {
          setCartCount(count);
        }
      } catch {
        if (isMounted) {
          setCartCount(0);
        }
      }
    }

    loadCartCount();

    function handleCartUpdated() {
      loadCartCount();
    }

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('cart-updated', handleCartUpdated);
    };
  }, []);

  if (isAdminRole(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <header className="header-root">
        <div className="header-inner">
          <div className="header-brand">
            <img className="header-logo" src={logoIcon} alt="iStore logo" />
            <h1>iStore</h1>
          </div>

          <div className="header-actions">
            {isSignedIn && userName ? <p className="header-greeting">Welcome, {userName}</p> : null}
            <nav className="header-nav">
              {navigation.map((item) => {
                if (item.kind === 'button') {
                  return (
                    <button key={item.key} type="button" onClick={handleLogout} className="nav-link nav-link-button">
                      <span className="nav-inline">
                        {navIcons[item.key]}
                        {item.label}
                      </span>
                    </button>
                  );
                }

                const isCartLink = item.key === 'cart';
                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-inline">
                      {navIcons[item.key]}
                      {isCartLink ? (
                        <>
                          {item.label}
                          {cartCount ? <span key={cartCount} className="nav-badge">{cartCount}</span> : null}
                        </>
                      ) : (
                        item.label
                      )}
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

export default CustomerLayout;
