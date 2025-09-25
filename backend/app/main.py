# backend/app/main.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from kafka import KafkaProducer
import time
import json
from typing import List
import redis
from collections import defaultdict # <--- THIS IS THE FIX

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Redis Connection ---
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

product_activity = defaultdict(list)

# Kafka producer
producer = KafkaProducer(
    bootstrap_servers='kafka:9092', 
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Simplified Herd Detection Logic
TIME_WINDOW_SECONDS = 10 
EVENT_THRESHOLD = 5

def check_herd_behavior(product_id):
    now = time.time()
    product_activity[product_id].append(now)
    relevant_timestamps = [t for t in product_activity[product_id] if now - t <= TIME_WINDOW_SECONDS]
    product_activity[product_id] = relevant_timestamps
    
    print(f"Product {product_id} has {len(relevant_timestamps)} events in the last {TIME_WINDOW_SECONDS} seconds.")

    if len(relevant_timestamps) >= EVENT_THRESHOLD:
        print(f"!!! HERD DETECTED for product {product_id} !!!")
        product_activity[product_id] = []
        return {"alert": True, "product_id": product_id}
        
    return {"alert": False, "product_id": product_id}

@app.get("/product-analytics/{product_id}")
async def get_product_analytics(product_id: int):
    stats = redis_client.hgetall(f"product:{product_id}:stats")
    total_views = int(stats.get("views", 0))
    total_adds = int(stats.get("adds_to_cart", 0))
    add_to_cart_rate = (total_adds / total_views * 100) if total_views > 0 else 0
    now = int(time.time() * 1000)
    one_minute_ago = now - 60000
    views_last_minute = redis_client.zcount(f"product:{product_id}:views", one_minute_ago, now)

    return {
        "product_id": product_id,
        "total_views": total_views,
        "total_adds_to_cart": total_adds,
        "add_to_cart_rate_percent": round(add_to_cart_rate, 2),
        "views_last_minute": views_last_minute
    }

@app.post("/event")
async def receive_event(request: Request):
    data = await request.json()
    pid = data["product_id"]
    etype = data["event_type"]
    now_ms = int(time.time() * 1000)

    if etype == "view_product":
        redis_client.hincrby(f"product:{pid}:stats", "views", 1)
        redis_client.zadd(f"product:{pid}:views", {f"event:{now_ms}": now_ms})
    elif etype == "add_to_cart":
        redis_client.hincrby(f"product:{pid}:stats", "adds_to_cart", 1)

    producer.send('product-events', value=data)
    result = check_herd_behavior(pid)
    if result["alert"]:
        await manager.broadcast(json.dumps(result))
    return {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        pass

