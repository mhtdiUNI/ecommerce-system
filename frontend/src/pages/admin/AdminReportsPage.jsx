import { Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusMessage from '../../components/ui/StatusMessage';
import { SkeletonBlock, SkeletonLine } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { isAdminAuthenticated, getToken } from '../../services/auth';

const FILTER_OPTIONS = ['All Reports', 'Active Reports'];

function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All Reports');
  const [runningReportId, setRunningReportId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadReports() {
      setLoading(true);
      setError('');

      try {
        const [reportsData, lowStockData] = await Promise.all([
          api.get('/admin/reports'),
          api.get('/admin/reports/low-stock?threshold=10').catch(() => [])
        ]);

        if (!isMounted) return;

        setReports(Array.isArray(reportsData) ? reportsData : []);
        setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : []);
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load reports right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredReports = useMemo(() => {
    const baseReports = filter === 'Active Reports'
      ? reports.filter((report) => report.enabled)
      : reports;

    return baseReports.filter((report) => {
      const reportName = String(report?.name || '').trim().toLowerCase();
      return reportName !== 'customer segmentation report';
    });
  }, [reports, filter]);

  async function handleRunReport(report) {
    setRunningReportId(report.id);
    setMessage('');
    setMessageType('success');

    try {
      const execution = await api.post(`/admin/reports/${report.id}/run`, {});
      setMessage(`Report "${report.name}" started successfully.`);
      if (execution?.status) {
        setMessage((prev) => `${prev} Status: ${execution.status}`);
      }
      if (execution?.fileName) {
        setMessage((prev) => `${prev} File: ${execution.fileName}`);
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err?.message || 'Unable to run the report.');
    } finally {
      setRunningReportId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <SkeletonLine width="30%" className="skeleton-title mb-sm" />
          <SkeletonLine width="50%" />
        </section>

        <div className="report-grid mt-lg">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="panel-card card-padding stack-sm">
              <SkeletonLine width="60%" className="skeleton-title" />
              <SkeletonLine width="80px" />
              <SkeletonLine width="40%" />
              <div className="flex-gap-sm">
                <SkeletonBlock className="skeleton-action-sm" height="2.2rem" />
                <SkeletonBlock className="skeleton-action-sm" height="2.2rem" />
                <SkeletonBlock className="skeleton-action-sm" height="2.2rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <h2 className="page-title">Admin Reports</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell layout-medium">
      <section className="panel panel-padding">
        <h2 className="page-title">Admin Reports</h2>
        <p className="page-subtitle">Run and review available reports from the backend.</p>

        <StatusMessage type={messageType} className="mb-lg">{message}</StatusMessage>

        <div className="mb-lg">
          <label className="form-field report-filter-field">
            <span className="muted">Filter reports</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-control">
              {FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        {filteredReports.length === 0 ? (
          <div className="empty-state">No reports are available at the moment.</div>
        ) : (
          <div className="report-grid">
            {filteredReports.map((report) => {
              const isRunning = runningReportId === report.id;

              return (
                <div key={report.id} className="panel-card report-card">
                  <div>
                    <div className="report-card-header">{report.name}</div>
                    <div className="muted text-sm report-card-description">{report.description || 'No description provided.'}</div>
                  </div>

                  <div className="flex-between-center report-meta-row">
                    <span className="muted text-sm">
                      Type: <span className="report-badge">{report.reportType || 'N/A'}</span>
                    </span>
                    <span className={`report-status-badge ${report.enabled ? 'report-status-active' : 'report-status-inactive'}`}>
                      {report.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="report-meta-row">
                    <button type="button" disabled={isRunning} onClick={() => handleRunReport(report)} className="btn btn-primary">
                      {!isRunning ? (
                        <>
                          <Play size={14} />
                          <span>Run Report</span>
                        </>
                      ) : (
                        'Running...'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel panel-padding">
        <h3 className="section-title">Low Stock</h3>
        {lowStockProducts.length === 0 ? (
          <p className="page-subtitle">No low-stock products were returned by the backend.</p>
        ) : (
          <div className="stack-sm">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="panel-card card-padding flex-between-center report-low-stock-card">
                <div>
                  <div className="fw-semibold">{product.name}</div>
                  {product.id ? <div className="muted text-sm mt-sm">ID: {product.id}</div> : null}
                </div>
                <span className="status-badge status-badge-error">
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

export default AdminReportsPage;
