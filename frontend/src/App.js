import React, { useEffect, useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import HerdAlert from "./HerdAlert";
import "./styles.css";
import { darkTheme, applyTheme } from "./darkTheme";
import { products } from "./products";
import { sendEvent } from "./eventTracker";

function App() {
  const [herdAlerts, setHerdAlerts] = useState([]);
  const [alertedProductIds, setAlertedProductIds] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [cartNotification, setCartNotification] = useState('');
  const [allEvents, setAllEvents] = useState([]);

  // Filters, Search, and Sort State
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // --- NEW: State to toggle the trending products view ---
  const [showOnlyTrending, setShowOnlyTrending] = useState(false);

  useEffect(() => {
    applyTheme(darkTheme);
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (evt) => {
      const newAlert = JSON.parse(evt.data);
      if (newAlert.alert) {
        const alertWithId = { ...newAlert, id: Date.now() };
        setHerdAlerts((prevAlerts) => [...prevAlerts, alertWithId]);
        setAlertedProductIds((prevIds) => [...new Set([...prevIds, newAlert.product_id])]);

        setTimeout(() => {
          setHerdAlerts((prevAlerts) =>
            prevAlerts.filter((alert) => alert.id !== alertWithId.id)
          );
        }, 5000);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, []);

  const processedProducts = useMemo(() => {
    let filtered = [...products];

    // --- UPDATED: Primary filter for trending products ---
    if (showOnlyTrending) {
      filtered = filtered.filter(p => alertedProductIds.includes(p.product_id));
    }
    // --- END OF UPDATE ---

    if (categoryFilter !== "All") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    if (priceFilter !== "All") {
      filtered = filtered.filter(p => {
        if (priceFilter === "<1000") return p.final_price < 1000;
        if (priceFilter === "1000-5000") return p.final_price >= 1000 && p.final_price <= 5000;
        if (priceFilter === ">5000") return p.final_price > 5000;
        return true;
      });
    }
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.final_price - b.final_price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.final_price - a.final_price);
        break;
      case 'rating-desc':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    return filtered;
  }, [categoryFilter, priceFilter, searchTerm, sortBy, showOnlyTrending, alertedProductIds]); // Added dependencies

  const logAndSendEvent = (type, product_id) => {
    sendEvent(type, product_id);
    setAllEvents(prev => [...prev, { product_id, type, timestamp: Date.now() }]);
  };

  const addToCart = (productToAdd) => {
    logAndSendEvent("add_to_cart", productToAdd.product_id);
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.product_id === productToAdd.product_id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.product_id === productToAdd.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product: productToAdd, quantity: 1 }];
      }
    });
    setCartNotification(`✅ Added ${productToAdd.product_name} to cart!`);
    setTimeout(() => setCartNotification(''), 3000);
  };
  
  const handleQuantityChange = (productId, amount) => {
    setCart(prevCart => {
        return prevCart.map(item => {
            if (item.product.product_id === productId) {
                const newQuantity = item.quantity + amount;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
            }
            return item;
        }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter(item => item.product.product_id !== productId));
  };
  
  const cartTotal = cart.reduce((total, item) => total + item.product.final_price * item.quantity, 0);

  const toggleWishlist = (productId) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="main-bg futuristic-bg">
      <div className="header">
        <h1>🚀 Real-Time Ecommerce Herd Behavior Alerter</h1>
        <div className="header-controls">
          <input type="text" className="search-bar" placeholder="Search products..." onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="icon-group">
            <div className="user-icon">👤</div>
            <div className="cart-icon" onClick={() => setShowCart(true)}>
              🛒 {cart.reduce((count, item) => count + item.quantity, 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="filter-sort-bar">
        <div className="filters">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option>Electronics</option>
            <option>Home</option>
            <option>Fitness</option>
            <option>Fashion</option>
          </select>
          <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
            <option value="All">All Prices</option>
            <option value="<1000">&lt;1000</option>
            <option value="1000-5000">1000-5000</option>
            <option value=">5000">&gt;5000</option>
          </select>
        </div>
        
        {/* --- NEW: Trending Products Button --- */}
        <button
          className={`trending-btn ${showOnlyTrending ? 'active' : ''}`}
          onClick={() => setShowOnlyTrending(!showOnlyTrending)}
        >
          {showOnlyTrending ? 'Show All Products' : '🔥 Trending'}
        </button>
        {/* --- END OF NEW BUTTON --- */}

        <div className="sort-by">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Sort By</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="products-grid">
        {processedProducts.map((p) => (
          <ProductCard
            key={p.product_id}
            product={p}
            alerted={alertedProductIds.includes(p.product_id)}
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            isWishlisted={wishlist.includes(p.product_id)}
            allEvents={allEvents} 
            logAndSendEvent={logAndSendEvent}
          />
        ))}
      </div>

      <HerdAlert alerts={herdAlerts} />
      {cartNotification && <div className="add-to-cart-toast">{cartNotification}</div>}

      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🛒 Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                <ul className="cart-items-list">
                  {cart.map((item) => (
                    <li key={item.product.product_id} className="cart-item">
                      <img src={item.product.main_image} alt={item.product.product_name} className="cart-item-image" />
                      <div className="cart-item-details">
                        <span className="cart-item-name">{item.product.product_name}</span>
                        <span className="cart-item-price">${item.product.final_price}</span>
                      </div>
                      <div className="cart-item-controls">
                        <div className="quantity-control">
                          <button onClick={() => handleQuantityChange(item.product.product_id, -1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item.product.product_id, 1)}>+</button>
                        </div>
                        <button className="remove-item-btn" onClick={() => removeFromCart(item.product.product_id)}>❌</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="cart-summary">
                  <h3>Total: ${cartTotal.toFixed(2)}</h3>
                  <button className="checkout-btn">Proceed to Checkout</button>
                </div>
              </>
            )}
            <button className="close-btn" onClick={() => setShowCart(false)}>✖ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;