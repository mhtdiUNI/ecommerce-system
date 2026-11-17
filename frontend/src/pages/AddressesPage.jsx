import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import AddressForm from '../components/AddressForm';
import StatusMessage from '../components/ui/StatusMessage';
import { SkeletonLine } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function AddressesPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!getToken()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadAddresses() {
      setLoading(true);
      setError('');

      try {
        const data = await api.get('/addresses');
        if (isMounted) {
          setAddresses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load your saved addresses.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  function handleAddressAdded(createdAddress) {
    setAddresses((prev) => [...prev, createdAddress]);
    setError('');
    setSuccess('Address saved successfully.');
  }

  return (
    <div className="page-shell layout-compact">
      <section className="panel panel-padding">
        {loading ? (
          <>
            <SkeletonLine width="35%" className="skeleton-title mb-sm" />
            <SkeletonLine width="55%" className="mb-lg" />
          </>
        ) : (
          <>
            <h2 className="page-title">My Addresses</h2>
            <p className="page-subtitle">Save a shipping address so checkout can be completed quickly.</p>
          </>
        )}

        <hr className="section-divider" />

        <h3 className="section-title mt-0">Add New Address</h3>

        <div className="mb-xl">
          <AddressForm onAddressAdded={handleAddressAdded} submitLabel="Add Address" />
        </div>
      </section>

      <section className="panel panel-padding">
        <h3 className="section-title mt-0">Saved Addresses</h3>

        <StatusMessage type="error" className="mb-lg">{error}</StatusMessage>
        <StatusMessage type="success" className="mb-lg">{success}</StatusMessage>

        {loading ? (
          <div className="stack-sm">
            {[0, 1, 2].map((item) => (
              <div key={item} className="panel-card card-padding address-skeleton-card">
                <SkeletonLine width="55%" className="skeleton-title" />
                <SkeletonLine width="40%" />
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <p className="muted">No saved addresses yet. Add your first shipping address above.</p>
        ) : (
          <div className="stack-sm">
            {addresses.map((address) => (
              <div key={address.id} className="panel-card card-padding address-card">
                <p className="address-card-title">
                  <span className="address-card-icon"><MapPin size={16} /></span>
                  {address.street}
                </p>
                <p className="muted address-card-meta">
                  {address.city}, {address.country} {address.zipCode}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AddressesPage;
