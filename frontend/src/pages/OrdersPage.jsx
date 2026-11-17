import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Loader, CheckCircle, XCircle, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import StatusMessage from '../components/ui/StatusMessage';
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { getToken } from '../services/auth';

const statusIcon = {
  CREATED:    <Clock size={13} />,
  PROCESSING: <Loader size={13} />,
  COMPLETED:  <CheckCircle size={13} />,
  CANCELLED:  <XCircle size={13} />
};

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/orders');
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) setError(err?.message || 'Unable to load your orders. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  function toggleExpand(id) {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  }

  function formatDate(value) {
    if (!value) return 'N/A';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusClassName(status) {
    const normalizedStatus = String(status || '').toUpperCase();

    switch (normalizedStatus) {
      case 'CREATED':
        return 'status-badge-neutral';
      case 'PROCESSING':
        return 'status-badge-info';
      case 'COMPLETED':
        return 'status-badge-success';
      case 'CANCELLED':
        return 'status-badge-error';
      default:
        return 'status-badge-neutral';
    }
  }

  const orderedHistory = [...orders].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return (a.id || 0) - (b.id || 0);
    }

    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;

    return aTime - bTime;
  });

  if (loading) {
    return (
      <div className="page-shell layout-compact">
        <section className="panel panel-padding">
          <SkeletonLine width="30%" className="skeleton-title mb-sm" />
        </section>

        <div className="stack-sm">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="panel-card card-padding flex-between-center">
              <div className="stack-sm">
                <SkeletonLine width="120px" className="skeleton-title" />
                <SkeletonLine width="200px" />
              </div>
              <div className="stack-sm align-end">
                <SkeletonLine width="80px" className="skeleton-title" />
                <SkeletonBlock className="skeleton-action" height="2.2rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell layout-compact">
        <section className="panel panel-padding">
          <h2 className="page-title">Unable to load your orders</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="page-shell layout-compact">
        <EmptyState
          title="Your Orders"
          message="You have not placed any orders yet."
          icon={ShoppingBag}
          action={(
            <Link to="/products" className="btn btn-primary mt-lg">
              <ShoppingBag size={16} />
              <span>Start Shopping</span>
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <div className="page-shell layout-compact">
      <section className="panel panel-padding">
        <h2 className="page-title">Your Orders</h2>

        <div className="stack-sm">
          {orderedHistory.map((order, index) => (
            <div key={order.id} className="panel-card card-padding">
              <div className="order-card-row">
                <div className="order-card-left">
                  <div className="order-card-meta">
                    <div className="fw-semibold">Order #{index + 1}</div>
                    <div className="muted text-sm">Date: {formatDate(order.createdAt)}</div>
                    <span className={`status-badge ${getStatusClassName(order.status)}`}>
                      {statusIcon[String(order.status).toUpperCase()]}
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="order-card-right">
                  <div className="fw-semibold">${parseFloat(order.totalAmount || '0').toFixed(2)}</div>
                  <button type="button" onClick={() => toggleExpand(order.id)} className="btn btn-secondary">
                    {expandedOrderId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{expandedOrderId === order.id ? 'Hide details' : 'View details'}</span>
                  </button>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="stack-sm mt-lg">
                  <div className="muted text-sm mb-xs">Items in this order</div>
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((it) => (
                      <div key={it.id} className="panel-card order-item-row">
                        <div>
                          <div className="fw-semibold">{it.productName}</div>
                          <div className="muted text-sm">Qty: {it.quantity}</div>
                        </div>
                        <div className="fw-semibold">${parseFloat(it.price || '0').toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No items available for this order.</div>
                  )}

                  <div className="flex-between-center order-summary-footer">
                    <span className="fw-semibold">Order Total</span>
                    <strong>${parseFloat(order.totalAmount || '0').toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default OrdersPage;
