// frontend/src/HerdAlert.js
import React from "react";
import "./styles.css";

function HerdAlert({ alerts }) {
  return (
    <div className="toast-bottom-left">
      {alerts.slice(-5).map((alert) => (
        <div key={alert.id} className="toast-alert">
          🚨 Product ID {alert.product_id} is trending!
        </div>
      ))}
    </div>
  );
}

export default HerdAlert;