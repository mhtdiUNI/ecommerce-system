import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductImage from '../../components/ProductImage';
import StatusMessage from '../../components/ui/StatusMessage';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { isAdminAuthenticated } from '../../services/auth';

function RecommendationAnalyticsPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadAnalytics() {
      setLoading(true);
      setError('');

      try {
        const [recommendationData, productData] = await Promise.all([
          api.get('/recommendations'),
          api.get('/products').catch(() => [])
        ]);

        if (!isMounted) return;

        setRecommendations(Array.isArray(recommendationData) ? recommendationData : []);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load recommendation analytics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const recommendationSummary = useMemo(() => {
    const totalRules = recommendations.length;
    const uniqueProducts = new Set();
    let highestConfidence = null;

    recommendations.forEach((rule) => {
      if (rule?.productName) {
        uniqueProducts.add(rule.productName);
      }

      if (Array.isArray(rule?.recommendations)) {
        rule.recommendations.forEach((item) => {
          if (item?.productName) {
            uniqueProducts.add(item.productName);
          }

          if (item?.score != null && (highestConfidence == null || Number(item.score) > Number(highestConfidence))) {
            highestConfidence = item.score;
          }
        });
      }
    });

    return [
      { label: 'Recommendation Rules', value: totalRules },
      { label: 'Unique Products', value: uniqueProducts.size },
      { label: 'Highest Confidence', value: highestConfidence == null ? 'N/A' : Number(highestConfidence).toFixed(2) }
    ];
  }, [recommendations]);

  const productLookup = useMemo(() => {
    const lookup = new Map();

    products.forEach((product) => {
      if (product?.id != null) {
        lookup.set(product.id, product);
      }
    });

    return lookup;
  }, [products]);

  const topRecommendations = useMemo(() => {
    return recommendations
      .map((rule) => ({
        productName: rule?.productName || 'Unknown product',
        productImage: getProductImage(rule?.productId, productLookup),
        recommendations: Array.isArray(rule?.recommendations)
          ? rule.recommendations.map((item) => ({
              ...item,
              productImage: getProductImage(item?.productId, productLookup)
            }))
          : [],
        bestScore: getBestScore(rule?.recommendations || [])
      }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 5);
  }, [recommendations, productLookup]);

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
          <h2 className="page-title">Recommendation Analytics</h2>
          <StatusMessage type="error" className="mt-md">{error}</StatusMessage>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell layout-medium">
      <section className="panel panel-padding">
        <h2 className="page-title">Recommendation Analytics</h2>
        <p className="page-subtitle">Review product recommendation rules and confidence scores.</p>
      </section>

      <section className="panel panel-padding">
        <div className="analytics-summary-grid mb-lg">
          {recommendationSummary.map((item) => (
            <div key={item.label} className="panel-card card-padding analytics-summary-card">
              <div className="muted text-sm">{item.label}</div>
              <div className="analytics-summary-value">{item.value}</div>
            </div>
          ))}
        </div>

        {topRecommendations.length === 0 ? (
          <div className="empty-state">No recommendation data is available yet.</div>
        ) : (
          <div className="stack-sm gap-md">
            {topRecommendations.map((rule, index) => {
              const topItem = rule.recommendations[0];
              return (
                <div key={`${rule.productName}-${index}`} className="panel-card card-padding stack-sm">
                  <div className="flex-between-center analytics-rule-row">
                    <div className="analytics-rule-row">
                      <ProductImage
                        src={rule.productImage}
                        alt={rule.productName}
                        className="analytics-rule-image"
                      />
                      <div>
                        <div className="fw-semibold">{rule.productName}</div>
                        <div className="muted text-sm">
                          Best confidence: {topItem?.score != null ? Number(topItem.score).toFixed(2) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="muted text-sm analytics-recommendation-label">Recommended with</div>
                    <div className="analytics-recommendation-list">
                      {rule.recommendations.length === 0 ? (
                        <div className="muted">No recommendations available.</div>
                      ) : (
                        rule.recommendations.slice(0, 4).map((item, itemIndex) => (
                          <div key={`${item?.productName || 'recommendation'}-${itemIndex}`} className="analytics-recommendation-item">
                            <div className="analytics-recommendation-item-inner">
                              <ProductImage
                                src={item.productImage}
                                alt={item?.productName || 'Recommended product'}
                                className="analytics-recommendation-item-image"
                              />
                              <span className="analytics-recommendation-item-name">{item?.productName || 'Unknown'}</span>
                            </div>
                            <span className="muted text-sm analytics-recommendation-item-score">
                              {item?.score != null ? Number(item.score).toFixed(2) : '—'}
                            </span>
                          </div>
                        ))
                      )}
                      {rule.recommendations.length > 4 ? (
                        <div className="analytics-recommendation-more">+{rule.recommendations.length - 4} more</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function getBestScore(recommendations) {
  return recommendations.reduce((bestScore, item) => {
    const score = Number(item?.score ?? -1);
    return Number.isFinite(score) && score > bestScore ? score : bestScore;
  }, -1);
}

function getProductImage(productId, productLookup) {
  const matchedProduct = productLookup.get(productId);
  return matchedProduct?.imageUrl || 'https://picsum.photos/seed/default/600/400';
}

export default RecommendationAnalyticsPage;
