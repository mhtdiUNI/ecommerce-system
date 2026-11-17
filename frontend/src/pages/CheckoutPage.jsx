import { CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutSteps from '../components/CheckoutSteps';
import StatusMessage from '../components/ui/StatusMessage';
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadCheckoutData() {
      setLoading(true);
      setError('');

      try {
        const [items, userAddresses] = await Promise.all([
          api.get('/cart'),
          api.get('/addresses')
        ]);

        if (isMounted) {
          const itemList = Array.isArray(items) ? items : [];
          const userAddressList = Array.isArray(userAddresses) ? userAddresses : [];
          if (itemList.length === 0) {
            navigate('/cart', { replace: true });
            return;
          }
          setCartItems(itemList);
          setAddresses(userAddressList);
          if (userAddressList.length > 0) {
            setSelectedAddressId(String(userAddressList[0].id));
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load checkout data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCheckoutData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setError('Please select a shipping address.');
      return;
    }

    setPlacing(true);
    setError('');

    try {
      await api.post('/orders/checkout', {
        shippingAddressId: parseInt(selectedAddressId, 10)
      });

      setSuccess(true);
      window.dispatchEvent(new Event('cart-updated'));
      setTimeout(() => {
        navigate('/orders', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Unable to place order. Please try again.');
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell layout-compact">
        <section className="panel panel-padding">
          <SkeletonLine width="30%" className="skeleton-title mb-sm" />
          <SkeletonLine width="50%" className="mb-lg" />

          <div className="product-hero-layout">
            <div className="product-hero-column">
              <SkeletonBlock className="skeleton-checkout-card" height="180px" />
            </div>

            <div className="product-hero-content">
              {[0, 1, 2, 3].map((item) => (
                <SkeletonLine key={item} />
              ))}
              <SkeletonBlock height="2.8rem" className="radius-10" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-shell layout-compact">
        <section className="panel panel-padding checkout-success">
          <svg className="checkmark" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="24" />
            <path className="checkmark-check" d="M14 27l7 7 16-16" />
          </svg>
          <h2 className="page-title">Order Placed Successfully!</h2>
          <p className="page-subtitle">Your order is confirmed and being processed.</p>
          <p className="muted mt-sm">Redirecting you to your orders...</p>
        </section>
      </div>
    );
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.totalPrice) || 0),
    0
  );

  return (
    <div className="page-shell layout-compact">
      <section className="panel panel-padding">
        <h2 className="page-title">Checkout</h2>
        <p className="page-subtitle mb-lg">Review your items and confirm your delivery details.</p>

        <CheckoutSteps current="checkout" />

        <StatusMessage type="error" className="mb-lg">{error}</StatusMessage>

        <div className="checkout-address-section">
          <div className="panel-card card-padding stack-md">
            <div>
              <h3 className="section-title mb-md">Shipping Address</h3>
              {addresses.length === 0 ? (
                <StatusMessage type="info">
                  No saved addresses yet. Add one from the Addresses page before checkout.
                </StatusMessage>
              ) : (
                <label className="form-field">
                  <span className="muted">Select delivery address</span>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    disabled={placing}
                    className={`form-control ${placing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <option value="">-- Select an address --</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={String(address.id)}>
                        {address.street}, {address.city}, {address.country} {address.zipCode}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel panel-padding summary-card-wide">
        <h3 className="section-title">Order Summary</h3>
        <div className="stack-sm">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="panel-card checkout-summary-item">
              <div>
                <p className="checkout-summary-item-title">{item.productName}</p>
                <p className="muted text-sm m-0">
                  Qty: {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                </p>
              </div>
              <strong>${parseFloat(item.totalPrice).toFixed(2)}</strong>
            </div>
          ))}
        </div>

        <div className="flex-between-center checkout-summary-footer">
          <span className="checkout-summary-total-label">Total:</span>
          <strong className="checkout-summary-total-value">${totalAmount.toFixed(2)}</strong>
        </div>

        <button type="button" onClick={handlePlaceOrder} disabled={placing || addresses.length === 0} className="btn btn-primary w-full mt-xl">
          <CreditCard size={16} />
          <span>{placing ? 'Placing Order...' : 'Place Order'}</span>
        </button>
      </section>
    </div>
  );
}

export default CheckoutPage;
