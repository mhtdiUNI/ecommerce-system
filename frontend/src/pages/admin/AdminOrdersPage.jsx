import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Loader, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import StatusMessage from '../../components/ui/StatusMessage';
import { SkeletonBlock, SkeletonLine } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { isAdminAuthenticated } from '../../services/auth';
import { showToast } from '../../services/toastStore';

const STATUS_FILTERS = ['All', 'CREATED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

const statusIcon = {
  CREATED:    <Clock size={13} />,
  PROCESSING: <Loader size={13} />,
  COMPLETED:  <CheckCircle size={13} />,
  CANCELLED:  <XCircle size={13} />
};

function getStatusBadgeClass(status) {
  const normalized = String(status || '').toUpperCase();

  switch (normalized) {
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

function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [busyOrderId, setBusyOrderId] = useState(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      setError('');

      try {
        const data = await api.get('/orders/all');
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load orders right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter = filter === 'All' || String(order.status || '').toUpperCase() === filter.toUpperCase();
      const matchesSearch = !normalizedSearch || String(order.id).includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  async function handleTransition(orderId, action) {
    setBusyOrderId(orderId);

    try {
      const path = action === 'process'
        ? `/orders/${orderId}/process`
        : action === 'complete'
          ? `/orders/${orderId}/complete`
          : `/orders/${orderId}/cancel`;

      await api.put(path, {});
      showToast(`Order ${orderId} updated successfully.`, 'success');
      const refreshed = await api.get('/orders/all');
      setOrders(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      showToast(err?.message || 'Unable to update the order.', 'error');
    } finally {
      setBusyOrderId(null);
    }
  }

  function renderActions(order) {
    const status = String(order.status || '').toUpperCase();

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      return null;
    }

    const isBusy = busyOrderId === order.id;

    return (
      <div className="admin-order-action-group">
        {(status === 'CREATED' || status === 'PENDING') ? (
          <>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'process')} className="btn btn-primary">
              {isBusy ? 'Working...' : 'Start Processing'}
            </button>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'cancel')} className="btn btn-secondary">
              {isBusy ? 'Working...' : 'Cancel'}
            </button>
          </>
        ) : null}

        {(status === 'PROCESSING' || status === 'CONFIRMED') ? (
          <>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'complete')} className="btn btn-primary">
              {isBusy ? 'Working...' : 'Complete'}
            </button>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'cancel')} className="btn btn-secondary">
              {isBusy ? 'Working...' : 'Cancel'}
            </button>
          </>
        ) : null}

        {status === 'SHIPPED' ? (
          <>
            <button type="button" disabled={isBusy} onClick={() => handleTransition(order.id, 'complete')} className="btn btn-primary">
              {isBusy ? 'Working...' : 'Mark as Delivered'}
            </button>
          </>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-shell layout-compact">
        <section className="panel panel-padding">
          <SkeletonLine width="30%" className="skeleton-title" />
        </section>

        <div className="stack-sm">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="panel-card card-padding flex-between-center">
              <div className="stack-sm">
                <SkeletonLine width="140px" className="skeleton-title" />
                <SkeletonLine width="220px" />
              </div>
              <div className="flex-gap-sm">
                <SkeletonBlock className="skeleton-badge" height="1.8rem" />
                <SkeletonLine width="70px" className="skeleton-title" />
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
          <h2 className="page-title">Admin Orders</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell layout-compact">
      <section className="panel panel-padding">
        <h2 className="page-title">Admin Orders</h2>
        <p className="page-subtitle">Manage customer orders and update their lifecycle.</p>

        <div className="grid-responsive admin-order-search-grid">
          <input
            type="text"
            placeholder="Search by order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
          />

          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-control">
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">No orders match the current filters.</div>
        ) : (
          <div className="stack-md">
            {filteredOrders.map((order) => {
              const status = String(order.status || '').toUpperCase();
              const itemCount = Array.isArray(order.items) ? order.items.length : 0;
              const subtotal = parseFloat(order.totalAmount || '0');

              return (
                <div key={order.id} className="panel-card card-padding">
                  <div className="admin-order-card-header">
                    <div>
                      <div className="fw-semibold">Order #{order.id}</div>
                      <div className="muted text-sm mt-sm">
                        Customer: {order.customerName || 'N/A'}
                      </div>
                      <div className="muted text-sm">
                        Items: {itemCount}
                      </div>
                    </div>

                    <div className="admin-order-card-actions">
                      <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                        {statusIcon[status]}
                        {status}
                      </span>
                      <strong>${subtotal.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="muted text-sm mt-lg">
                    Shipping address: {order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.country}${order.shippingAddress.zipCode ? `, ${order.shippingAddress.zipCode}` : ''}` : 'N/A'}
                  </div>
                  <div className="admin-order-total-row">
                    <div className="admin-order-total-left">
                      <span className="fw-semibold">Order Total</span>
                      <strong>${subtotal.toFixed(2)}</strong>
                    </div>

                    <div className="admin-order-total-right">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                      >
                        {expandedOrderId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span>{expandedOrderId === order.id ? 'Hide items' : 'View items'}</span>
                      </button>
                      {renderActions(order)}
                    </div>
                  </div>

                  {expandedOrderId === order.id ? (
                    <div className="panel panel-padding admin-order-products">
                      <div className="admin-order-products-title">Purchased products</div>
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        <div className="stack-sm">
                          {order.items.map((item) => (
                            <div key={item.id} className="panel-card admin-order-item-row">
                              <div>
                                <div className="fw-semibold">{item.productName}</div>
                                <div className="muted text-sm">Qty: {item.quantity}</div>
                              </div>
                              <div className="admin-order-item-details">
                                <div className="muted text-sm">Unit price: ${parseFloat(item.price || '0').toFixed(2)}</div>
                                <div className="fw-semibold">Line total: ${(parseFloat(item.price || '0') * item.quantity).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="muted">No items available for this order.</div>
                      )}

                      <div className="admin-order-total-row">
                        <div className="admin-order-total-left">
                          <span className="fw-semibold">Order Total</span>
                          <strong>${subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="admin-order-total-right" />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminOrdersPage;
