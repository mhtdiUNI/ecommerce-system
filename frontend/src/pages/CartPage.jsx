import { CreditCard, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutSteps from '../components/CheckoutSteps';
import ProductImage from '../components/ProductImage';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { getToken } from '../services/auth';
import { showToast } from '../services/toastStore';

function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadCart() {
      setLoading(true);

      try {
        const items = await api.get('/cart');
        const normalizedItems = Array.isArray(items) ? items : [];

        if (!isMounted) {
          return;
        }

        const itemsWithImages = await Promise.all(
          normalizedItems.map(async (item) => {
            if (!item?.productId) {
              return { ...item, imageUrl: '' };
            }

            try {
              const product = await api.get(`/products/${item.productId}`);
              return { ...item, imageUrl: product?.imageUrl || '' };
            } catch {
              return { ...item, imageUrl: '' };
            }
          })
        );

        setCartItems(itemsWithImages);
      } catch (err) {
        if (isMounted) {
          showToast('Unable to load your cart. Please try again.', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  async function handleUpdateQuantity(cartItemId, newQuantity) {
    const parsedQuantity = Number(newQuantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return;
    }

    setUpdatingItemId(cartItemId);

    try {
      const response = await api.put(`/cart/${cartItemId}/quantity`, { quantity: newQuantity });
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.cartItemId === cartItemId
            ? {
                ...item,
                quantity: response.quantity,
                totalPrice: response.totalPrice
              }
            : item
        )
      );
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      showToast(err?.message || 'Unable to update quantity. Please try again.', 'error');
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRemoveItem(cartItemId) {
    setRemovingItemId(cartItemId);

    try {
      await api.delete(`/cart/${cartItemId}`);
      setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
      window.dispatchEvent(new Event('cart-updated'));
      showToast('Item removed from cart.', 'success');
    } catch (err) {
      showToast(err?.message || 'Unable to remove item. Please try again.', 'error');
      setRemovingItemId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-shell layout-compact">
        <section className="panel panel-padding">
          <SkeletonLine width="35%" className="skeleton-title mb-sm" />
          <SkeletonLine width="25%" />
        </section>

        <div className="stack-sm">
          {[0, 1, 2].map((item) => (
            <div key={item} className="panel-card cart-item-card">
              <div className="skeleton cart-item-image" />
              <div className="stack-sm">
                <SkeletonLine width="60%" className="skeleton-title" />
                <SkeletonLine width="35%" />
                <div className="skeleton h-2-5rem radius-10 cart-quantity-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.totalPrice) || 0),
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="page-shell layout-compact">
        <EmptyState
          title="Your Shopping Cart"
          message="Your shopping cart is empty."
          icon={ShoppingBag}
          action={(
            <>
              <div className="flex-gap-sm flex-align-center font-size-0-95rem mb-lg justify-center">
                <CheckoutSteps current="cart" />
              </div>
              <Link to="/products" className="btn btn-primary">
                <ShoppingBag size={16} />
                <span>Continue Shopping</span>
              </Link>
            </>
          )}
        />
      </div>
    );
  }

  return (
    <div className="page-shell layout-compact">
      <section className="panel panel-padding">
        <h2 className="page-title">Your Shopping Cart</h2>
        <p className="page-subtitle mb-lg">
          {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
        </p>

        <CheckoutSteps current="cart" />

        <div className="stack-sm">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="panel-card cart-item-card cart-item-row">
              <ProductImage src={item.imageUrl} alt={item.productName} className="cart-item-image" fallbackSeed="product" />

              <div>
                <h4 className="cart-item-title">{item.productName}</h4>
                <p className="muted m-0">Unit Price: ${parseFloat(item.unitPrice).toFixed(2)}</p>

                <div className="cart-item-meta mt-sm">
                  <label className="form-field cart-quantity-field">
                    <span className="muted">Quantity</span>
                    <input
                      type="number"
                      min="1"
                      aria-label="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.cartItemId, parseInt(e.target.value, 10))}
                      disabled={updatingItemId === item.cartItemId}
                      className="form-control cart-quantity-input"
                    />
                  </label>

                  <button type="button" onClick={() => handleRemoveItem(item.cartItemId)} disabled={removingItemId === item.cartItemId} className="btn btn-danger">
                    <Trash2 size={16} />
                    <span>{removingItemId === item.cartItemId ? 'Removing...' : 'Remove'}</span>
                  </button>
                </div>
              </div>

              <div className="text-right">
                <strong className="font-size-1-1rem">${parseFloat(item.totalPrice).toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-padding stack-md">
        <h3 className="section-title">Order Summary</h3>

        <div className="flex-between-center cart-order-summary-row">
          <span className="checkout-summary-total-label text-sm">Total Items:</span>
          <span>{totalItems}</span>
        </div>

        <div className="flex-between-center">
          <span className="checkout-summary-total-label font-size-1-15rem">Total Amount:</span>
          <strong className="font-size-1-6rem">${totalAmount.toFixed(2)}</strong>
        </div>

        <div className="button-row">
          <button type="button" onClick={() => navigate('/checkout')} className="btn btn-primary flex-1">
            <CreditCard size={16} />
            <span>Proceed to Checkout</span>
          </button>

          <Link to="/products" className="btn btn-secondary flex-1">
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default CartPage;
