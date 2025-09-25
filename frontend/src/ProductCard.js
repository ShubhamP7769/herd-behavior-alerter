import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// A simple component to render stars
const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(<span key={i} className="star filled">★</span>);
    } else {
      stars.push(<span key={i} className="star">☆</span>);
    }
  }
  return <div className="star-rating">{stars}</div>;
};

function ProductCard({ product, alerted, addToCart, toggleWishlist, isWishlisted, allEvents, logAndSendEvent }) {
  const [showModal, setShowModal] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (showChart) {
      const productEvents = allEvents.filter(e => e.product_id === product.product_id);
      const data = productEvents.map((event, index) => ({
        name: `Activity ${index + 1}`,
        "User Actions": index + 1,
      }));
      setChartData(data);
    }
  }, [allEvents, product.product_id, showChart]);

  // --- UPDATED: This function now also hides the analytics ---
  const handleAnalyticsClick = async () => {
    // If analytics are already showing, hide them and stop.
    if (analytics) {
      setAnalytics(null);
      return;
    }

    // Otherwise, fetch the analytics data.
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch(`http://localhost:8000/product-analytics/${product.product_id}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  return (
    <>
      <div id={`product-${product.product_id}`} className={`product-card ${alerted ? "alerted" : ""}`}>
        <div className="product-card-header">
          {product.badge && <div className={`badge badge-${product.badge.toLowerCase()}`}>{product.badge}</div>}
          <button className={`wishlist-btn ${isWishlisted ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleWishlist(product.product_id); }}>
            ♥
          </button>
        </div>
        
        <div className="product-image-container" onClick={() => { logAndSendEvent("view_product", product.product_id); setShowModal(true); }}>
            <img className="product-image" src={product.main_image} alt={product.product_name} />
        </div>
        
        <div className="product-info">
          <h3>{product.product_name}</h3>
          <p className="brand">{product.brand}</p>
          <div className="product-rating">
            {product.rating && <StarRating rating={product.rating} />}
            {product.reviewCount && <span className="review-count">({product.reviewCount})</span>}
          </div>
          <p className="price">{product.final_price ? `$${product.final_price}` : "N/A"}</p>
          <div className="product-actions">
            <button className="add-btn" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
              🛒 Add to Cart
            </button>
            <button className="chart-btn" onClick={(e) => { e.stopPropagation(); setShowChart(true); }}>
              📈 Chart
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={product.main_image} alt={product.product_name} className="modal-product-image" />
            <h2>{product.product_name}</h2>
            <p className="brand">{product.brand}</p>
            <p className="price">{product.final_price ? `$${product.final_price}` : "N/A"}</p>
            <p className="description">{product.description}</p>
            
            <div className="modal-actions">
              {/* --- UPDATED: Button now toggles and text changes --- */}
              <button className="analytics-btn" onClick={handleAnalyticsClick}>
                {analytics ? "📊 Hide Analytics" : "📊 Show Analytics"}
              </button>
            </div>

            {isLoadingAnalytics && <p>Loading analytics...</p>}

            {analytics && (
              <div className="analytics-section">
                <div className="analytics-item">
                  <span className="analytics-label">Total Views</span>
                  <span className="analytics-value">{analytics.total_views}</span>
                </div>
                <div className="analytics-item">
                  <span className="analytics-label">Total Adds to Cart</span>
                  <span className="analytics-value">{analytics.total_adds_to_cart}</span>
                </div>
                 <div className="analytics-item">
                  <span className="analytics-label">Add to Cart Rate</span>
                  <span className="analytics-value">{analytics.add_to_cart_rate_percent}%</span>
                </div>
                 <div className="analytics-item">
                  <span className="analytics-label">Views (Last Minute)</span>
                  <span className="analytics-value">{analytics.views_last_minute}</span>
                </div>
              </div>
            )}

            <button className="close-btn" onClick={() => setShowModal(false)}>✖ Close</button>
          </div>
        </div>
      )}

      {showChart && (
        <div className="modal-overlay" onClick={() => setShowChart(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{product.product_name} - Activity Trend</h3>
            {chartData.length > 0 ? (
              <LineChart width={450} height={250} data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false}/>
                <Tooltip />
                <CartesianGrid stroke="#333" strokeDasharray="5 5"/>
                <Line type="monotone" dataKey="User Actions" stroke="#ff3576" strokeWidth={2}/>
              </LineChart>
            ) : (
              <p>No activity has been recorded for this product yet.</p>
            )}
            <button className="close-btn" onClick={() => setShowChart(false)}>✖ Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductCard;