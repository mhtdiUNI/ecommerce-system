import { Link } from 'react-router-dom';
import { Truck, Lock, Package, ShoppingBag } from 'lucide-react';
import heroBanner from '../assets/hero-banner.png';

function HomePage() {
  return (
    <div className="page-shell layout-medium">
      <section
        className="panel panel-padding hero-panel"
        style={{
          backgroundImage: `linear-gradient(90deg, var(--surface) 0%, var(--surface) 35%, transparent 100%), url(${heroBanner})`,
          backgroundPosition: 'right center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero-layout">
          <div className="hero-copy">
            <span className="muted hero-badge">
              Fresh picks for every need
            </span>
            <h2 className="page-title m-0">Welcome to iStore</h2>
            <p className="page-subtitle m-0 max-width-680">
              Discover quality electronics, enjoy a smooth shopping experience, and keep track of your orders with ease.
            </p>
            <Link to="/products" className="btn btn-primary hero-cta">
              <ShoppingBag size={16} />
              <span>Shop Now</span>
            </Link>
          </div>
        </div>
      </section>

      <hr className="signal-divider" />

      <section className="grid-responsive">
        <article className="panel panel-card feature-article">
          <div className="feature-article-icon">
            <Truck size={24} />
          </div>
          <h3 className="section-title feature-article-title">Fast Delivery</h3>
          <p className="muted m-0">Orders processed and shipped quickly.</p>
        </article>

        <article className="panel panel-card feature-article">
          <div className="feature-article-icon">
            <Lock size={24} />
          </div>
          <h3 className="section-title feature-article-title">Secure Checkout</h3>
          <p className="muted m-0">Your payment info is always protected.</p>
        </article>

        <article className="panel panel-card feature-article">
          <div className="feature-article-icon">
            <Package size={24} />
          </div>
          <h3 className="section-title feature-article-title">Easy Returns</h3>
          <p className="muted m-0">Hassle-free returns within 30 days.</p>
        </article>
      </section>
    </div>
  );
}

export default HomePage;
