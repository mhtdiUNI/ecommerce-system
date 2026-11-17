import { useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusMessage from '../../components/ui/StatusMessage';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { isAdminAuthenticated } from '../../services/auth';

function CustomerSegmentationPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadCustomers() {
      setLoading(true);
      setError('');

      try {
        const customerData = await api.get('/admin/segments');

        if (!isMounted) return;

        setCustomers(Array.isArray(customerData) ? customerData : []);
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load customer segmentation data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const customerSummary = useMemo(() => {
    const vipCount = customers.filter((customer) => normalizeSegment(customer.segment) === 'VIP').length;
    const regularCount = customers.filter((customer) => normalizeSegment(customer.segment) === 'REGULAR').length;
    const lowValueCount = customers.filter((customer) => normalizeSegment(customer.segment) === 'LOW_VALUE').length;

    return [
      { label: 'Total Customers', value: customers.length },
      { label: 'VIP', value: vipCount },
      { label: 'Regular', value: regularCount },
      { label: 'Low Value', value: lowValueCount }
    ];
  }, [customers]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
      .slice(0, 10);
  }, [customers]);

  if (loading) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <SkeletonLine width="35%" className="skeleton-title mb-sm" />
          <SkeletonLine width="55%" className="mb-lg" />
          <div className="analytics-summary-grid">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="panel-card card-padding stack-sm">
                <SkeletonLine width="50%" />
                <SkeletonLine width="40%" className="skeleton-title" />
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
          <h2 className="page-title">Customer Segmentation</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell layout-medium">
      <section className="panel panel-padding">
        <h2 className="page-title">Customer Segmentation</h2>
        <p className="page-subtitle">Inspect customer segments and spending patterns.</p>
      </section>

      <section className="panel panel-padding">
        <div className="analytics-summary-grid mb-lg">
          {customerSummary.map((item) => (
            <div key={item.label} className="panel-card card-padding analytics-summary-card analytics-summary-card-success">
              <div className="muted text-sm">{item.label}</div>
              <div className="analytics-summary-value">{item.value}</div>
            </div>
          ))}
        </div>

        {topCustomers.length === 0 ? (
          <div className="empty-state">No customer segmentation data is available yet.</div>
        ) : (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Spending</th>
                  <th>Segment</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => {
                  const segment = normalizeSegment(customer.segment);
                  return (
                    <tr key={customer.userId ?? `${customer.name}-${customer.totalSpent}`}>
                      <td>
                        <div className="analytics-customer-cell">
                          <div className="analytics-customer-avatar">
                            <User size={24} color="currentColor" />
                          </div>
                          <span>{customer.name || 'Unknown customer'}</span>
                        </div>
                      </td>
                      <td>{customer.email || '—'}</td>
                      <td>${Number(customer.totalSpent || 0).toFixed(2)}</td>
                      <td>
                        <span className={`analytics-segment-badge ${getSegmentBadgeClass(segment)}`}>
                          {segment || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function normalizeSegment(segment) {
  return String(segment || '').trim().toUpperCase();
}

function getSegmentBadgeClass(segment) {
  const normalized = normalizeSegment(segment);

  if (normalized === 'VIP') {
    return 'analytics-segment-badge-vip';
  }

  if (normalized === 'REGULAR') {
    return 'analytics-segment-badge-regular';
  }

  if (normalized === 'LOW_VALUE') {
    return 'analytics-segment-badge-low-value';
  }

  return 'analytics-segment-badge-default';
}

export default CustomerSegmentationPage;
