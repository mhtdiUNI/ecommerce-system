import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Users, ShoppingCart, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import StatusMessage from '../../components/ui/StatusMessage';
import { SkeletonBlock, SkeletonLine } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { isAdminAuthenticated } from '../../services/auth';

function formatCurrencyAbbreviated(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '$0.00';
  }

  const absValue = Math.abs(numericValue);

  if (absValue >= 1000000000) {
    return `$${(numericValue / 1000000000).toFixed(2)}B`;
  }

  if (absValue >= 1000000) {
    return `$${(numericValue / 1000000).toFixed(2)}M`;
  }

  if (absValue >= 1000) {
    return `$${(numericValue / 1000).toFixed(2)}K`;
  }

  return `$${numericValue.toFixed(2)}`;
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError('');

      try {
        const [dashboardData, allOrders, lowStockData] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/orders/all').catch(() => []),
          api.get('/admin/reports/low-stock?threshold=10').catch(() => [])
        ]);

        if (!isMounted) return;

        setDashboard(dashboardData || null);
        setOrders(Array.isArray(allOrders) ? allOrders : []);
        setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : []);
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load the admin dashboard right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const metrics = useMemo(() => {
    if (!dashboard) return [];

    const createdCount = orders.filter((order) => String(order.status || '').toUpperCase() === 'CREATED').length;

    return [
      { label: 'Total Products', value: dashboard.totalProducts ?? 'N/A', icon: <Package size={18} /> },
      { label: 'Total Customers', value: dashboard.totalUsers ?? 'N/A', icon: <Users size={18} /> },
      { label: 'Total Orders', value: dashboard.totalOrders ?? 'N/A', icon: <ShoppingCart size={18} /> },
      {
        label: 'Total Revenue',
        value: dashboard.totalRevenue != null ? formatCurrencyAbbreviated(dashboard.totalRevenue) : 'N/A',
        fullValue: dashboard.totalRevenue != null ? `$${Number(dashboard.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
        icon: <DollarSign size={18} />
      },
      { label: 'Orders in CREATED', value: createdCount, icon: <FileText size={18} /> },
      { label: 'Low-stock products', value: lowStockProducts.length, icon: <AlertTriangle size={18} /> }
    ];
  }, [dashboard, orders, lowStockProducts]);

  if (loading) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <SkeletonLine width="35%" className="skeleton-title mb-sm" />
          <SkeletonLine width="55%" />

          <div className="grid-responsive mt-lg">
            {[0, 1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="panel panel-card card-padding-lg metric-card">
                <SkeletonLine width="50%" className="mb-sm" />
                <SkeletonLine width="60%" className="skeleton-title" />
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-padding">
          <SkeletonLine width="30%" className="skeleton-title mb-lg" />
          <div className="stack-sm">
            {[0, 1, 2].map((item) => (
              <div key={item} className="panel-card card-padding flex-between-center">
                <SkeletonLine width="40%" />
                <SkeletonBlock className="skeleton-pill" height="1.6rem" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <h2 className="page-title">Admin Dashboard</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell layout-medium">
      <section className="panel panel-padding">
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-subtitle">Overview of the store’s current performance.</p>

        <div className="grid-responsive mt-lg">
          {metrics.map((metric) => (
            <div key={metric.label} className="panel panel-card metric-card">
              <div className="metric-meta">
                <span>{metric.icon}</span>
                <div className="metric-label">{metric.label}</div>
              </div>
              <div className="metric-value" title={metric.fullValue}>{metric.value}</div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      <section className="panel panel-padding">
        <h3 className="section-title">Low-stock Products</h3>
        {lowStockProducts.length === 0 ? (
          <p className="page-subtitle">No low-stock products were returned by the backend.</p>
        ) : (
          <div className="stack-sm">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="panel-card card-padding flex-between-center gap-md">
                <div className="flex-gap-sm flex-align-center">
                  <div className="inventory-icon">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <strong>{product.name}</strong>
                    <div className="muted text-sm mt-xs">
                      {product.category || product.id || 'Inventory item'}
                    </div>
                  </div>
                </div>
                <span className="inventory-pill">
                  Stock: {product.stock}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
