import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import EmptyState from '../components/ui/EmptyState';
import StatusMessage from '../components/ui/StatusMessage';
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { getToken } from '../services/auth';
import { showToast } from '../services/toastStore';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingProductId, setAddingProductId] = useState(null);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    let isMounted = true;

    async function loadProductsPage() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.get('/products').catch(() => []),
          api.get('/categories').catch(() => [])
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        if (isMounted) {
          setError('Unable to load products right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProductsPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch = !normalizedSearch || product.name?.toLowerCase().includes(normalizedSearch);
      const matchesCategory = selectedCategory === 'All Categories' || product.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === 'price-desc') {
        return Number(b.price) - Number(a.price);
      }
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [products, search, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="page-shell layout-medium">
        <section className="panel panel-padding">
          <SkeletonLine width="40%" className="skeleton-title mb-sm" />
          <SkeletonLine width="60%" />
        </section>

        <section className="panel panel-padding">
          <div className="grid-responsive">
            {[0, 1, 2].map((item) => (
              <div key={item}>
                <SkeletonLine width="30%" className="mb-xs" />
                <SkeletonBlock className="skeleton-card" />
              </div>
            ))}
          </div>
        </section>

        <div className="grid-responsive">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="panel panel-padding product-card">
              <SkeletonBlock className="skeleton-card product-card-image" />
              <SkeletonLine width="70%" className="skeleton-title" />
              <SkeletonLine width="40%" />
              <div className="skeleton h-2-5rem radius-10" />
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
          <h2 className="page-title">Products are temporarily unavailable</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  async function handleAddToCart(productId) {
    if (!getToken()) {
      navigate('/login', { replace: true });
      return;
    }

    setAddingProductId(productId);

    try {
      await api.post('/cart', { productId, quantity: 1 });
      showToast('Added to cart successfully.', 'success');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      showToast(err?.message || 'Unable to add item to cart. Please try again.', 'error');
    } finally {
      setAddingProductId(null);
    }
  }

  return (
    <div className="page-shell layout-medium">
      <section className="panel panel-padding">
        <h2 className="page-title">Products</h2>
        <p className="page-subtitle">Browse the available electronics from the store catalog.</p>
      </section>

      <section className="panel panel-padding">
        <div className="grid-responsive products-filters">
          <label className="form-field">
            <span className="muted">Search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name"
              className="form-control"
            />
          </label>

          <label className="form-field">
            <span className="muted">Category</span>
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="form-control">
              <option value="All Categories">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="muted">Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="form-control">
              <option value="name">Name (A–Z)</option>
              <option value="price-asc">Price (Low → High)</option>
              <option value="price-desc">Price (High → Low)</option>
            </select>
          </label>
        </div>
      </section>

      {filteredProducts.length === 0 ? (
        <EmptyState message="No products match your current filters." />
      ) : (
        <div className="products-grid-compact">
          {filteredProducts.map((product, index) => {
            const isOutOfStock = Number(product.stock) <= 0;

            return (
              <div
                key={product.id}
                className="panel panel-padding product-card"
                style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              >
                <div className="product-card-image-frame">
                  <ProductImage src={product.imageUrl} alt={product.name} className="product-card-image" />
                </div>
                <div>
                  <h4 className="product-card-title">{product.name}</h4>
                  <span className="category-pill product-card-subtitle">{product.categoryName || 'Uncategorized'}</span>
                </div>
                <div className="flex-between-center">
                  <strong className="product-price">${product.price == null ? 'N/A' : Number(product.price).toFixed(2)}</strong>
                  <span className="stock-indicator muted">
                    <span
                      className={`stock-dot ${
                        isOutOfStock ? 'stock-dot-out' : Number(product.stock) <= 5 ? 'stock-dot-low' : 'stock-dot-pulse'
                      }`}
                    />
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="product-card-actions">
                  <Link to={`/products/${product.id}`} className="btn btn-secondary product-card-action">
                    View Details
                  </Link>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      disabled={isOutOfStock || addingProductId === product.id}
                      onClick={() => handleAddToCart(product.id)}
                      className={`btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'} product-card-action-wide`}
                    >
                      {isOutOfStock ? 'Out of Stock' : addingProductId === product.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
