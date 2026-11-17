import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import StatusMessage from '../components/ui/StatusMessage';
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const isAuthenticated = Boolean(getToken());
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setLoading(true);
      setError('');
      setNotFound(false);
      setProduct(null);
      setRecommendations([]);

      try {
        const productData = await api.get(`/products/${id}`);

        if (!isMounted) {
          return;
        }

        setProduct(productData);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err?.status === 404) {
          setNotFound(true);
        } else {
          setError('Unable to load product details right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      if (!product?.id) {
        setRecommendations([]);
        return;
      }

      setRecommendationsLoading(true);

      try {
        const recommendationData = await api.get(`/recommendations/product/${product.id}`);
        const recommendedItems = Array.isArray(recommendationData?.recommendations) ? recommendationData.recommendations : [];

        const detailedRecommendations = await Promise.all(
          recommendedItems.map(async (item) => {
            try {
              const detail = await api.get(`/products/${item.productId}`);
              return {
                id: item.productId,
                name: item.productName,
                imageUrl: detail.imageUrl,
                price: detail.price
              };
            } catch {
              return {
                id: item.productId,
                name: item.productName,
                imageUrl: '',
                price: null
              };
            }
          })
        );

        if (!isMounted) {
          return;
        }

        setRecommendations(detailedRecommendations);
      } catch {
        if (isMounted) {
          setRecommendations([]);
        }
      } finally {
        if (isMounted) {
          setRecommendationsLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [product?.id, isAuthenticated]);

  if (loading) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding product-hero-layout">
          <div className="product-hero-column">
            <SkeletonBlock className="skeleton-product-image" />
          </div>

          <div className="product-hero-content">
            <SkeletonLine width="70%" className="skeleton-title" />
            <SkeletonLine width="30%" />
            <SkeletonLine width="50%" />
            <SkeletonBlock className="skeleton-cta" height="2.8rem" />
          </div>
        </section>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <h2 className="page-title">Product not found</h2>
          <p className="page-subtitle">The requested product could not be found.</p>
          <Link to="/products" className="btn btn-secondary mt-lg">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <h2 className="page-title">Product unavailable</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  async function handleAddToCart() {
    setCartMessage('');
    setCartError('');

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    setIsAdding(true);

    try {
      await api.post('/cart', { productId: product.id, quantity: 1 });
      setCartMessage('Added to cart successfully.');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setCartError(err?.message || 'Unable to add item to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }

  if (!product) {
    return null;
  }

  const isOutOfStock = Number(product.stock) <= 0;
  const imageUrl = product.imageUrl || 'https://picsum.photos/seed/default/600/400';

  return (
    <div className="page-shell layout-medium">
      <section className="panel panel-padding stack-md">
        <Link to="/products" className="muted fw-semibold">
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </Link>

        <div className="product-hero-grid">
          <ProductImage src={imageUrl} alt={product.name} className="product-hero-image" />

          <div className="product-hero-content">
            <h2 className="page-title m-0">{product.name}</h2>
            <p className="muted m-0">{product.categoryName || 'Uncategorized'}</p>
            <p className="m-0 line-height-body">{product.description}</p>

            <div className="flex-between-center product-meta">
              <strong className="product-price">${product.price == null ? 'N/A' : Number(product.price).toFixed(2)}</strong>
              <span className="stock-indicator muted">
                <span
                  className={`stock-dot ${
                    isOutOfStock ? 'stock-dot-out' : Number(product.stock) <= 5 ? 'stock-dot-low' : 'stock-dot-pulse'
                  }`}
                />
                Available stock: {product.stock}
              </span>
            </div>

            <div className="stack-sm">
              {isAuthenticated ? (
                <div className="product-meta">
                  <button
                    type="button"
                    disabled={isOutOfStock || isAdding}
                    onClick={handleAddToCart}
                    className={`btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {isOutOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
                  </button>
                  {isOutOfStock ? <span className="out-of-stock-badge">Out of Stock</span> : null}
                </div>
              ) : null}
              <StatusMessage type="success">{cartMessage}</StatusMessage>
              <StatusMessage type="error">{cartError}</StatusMessage>
            </div>
          </div>
        </div>
      </section>

      <section className="panel panel-padding">
        <h3 className="section-title">Customers who bought this also bought</h3>

        {!isAuthenticated ? (
          <p className="muted">Log in to receive personalized recommendations.</p>
        ) : recommendationsLoading ? (
          <div className="grid-recommendations">
            {[0, 1, 2].map((i) => (
              <div key={i} className="panel-card recommendation-card">
                <SkeletonBlock className="skeleton-recommendation" />
                <SkeletonLine width="60%" className="skeleton-title" />
                <SkeletonLine width="40%" />
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid-recommendations">
            {recommendations.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="panel-card recommendation-card">
                <div className="recommendation-image-frame">
                  <ProductImage src={item.imageUrl} alt={item.name} className="recommendation-image" />
                </div>
                <div>
                  <h4 className="m-0 mb-xxs">{item.name}</h4>
                  <p className="m-0 product-price">${item.price == null ? 'N/A' : Number(item.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">No recommendations are available yet. As more completed purchases are made, personalized suggestions will appear.</p>
        )}
      </section>
    </div>
  );
}

export default ProductDetailsPage;
