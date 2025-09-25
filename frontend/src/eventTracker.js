// frontend/src/eventTracker.js
export function sendEvent(type, product_id) {
  fetch("http://localhost:8000/event", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ event_type: type, product_id, timestamp: Date.now() })
  }).catch(err => console.error("Event send error:", err));
}
