# Herd Behavior Alerter 🛒⚡

A real-time e-commerce analytics tool that detects **herd behavior** — sudden surges of user activity on specific products — to help marketing and inventory teams identify trending items instantly.

---

## 📂 Project Structure

herd-behavior-alerter/
│── backend/                # FastAPI backend
│   ├── app/
│   │   ├── detector.py     # Herd behavior detection logic
│   │   └── main.py         # FastAPI entry point
│   ├── Dockerfile          # Backend Docker setup
│   └── requirements.txt    # Python dependencies
│
│── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/                # React components
│   ├── Dockerfile          # Frontend Docker setup
│   ├── package.json        # Node.js dependencies
│   └── .gitignore
│
│── docker-compose.yml      # Orchestrates frontend + backend
│── README.md               # Project documentation
│── LICENSE                 # License info
│── .gitignore              # Root gitignore

---

## 🚀 Getting Started

### Prerequisites
- Docker installed
- Node.js (if running frontend locally)
- Python 3.9+ (if running backend locally)

---

### Run with Docker
docker-compose up --build

Backend → http://localhost:8000  
Frontend → http://localhost:3000  

---

### Run Backend Locally
cd backend  
pip install -r requirements.txt  
uvicorn app.main:app --reload  

---

### Run Frontend Locally
cd frontend  
npm install  
npm start  

---

## ✨ Features
- Real-time herd behavior alerts  
- Interactive modern UI  
- Dockerized deployment  
- Supports 100+ sample products  

---

## 📜 License
This project is licensed under the MIT License – see the LICENSE file for details.  

---

## 👨‍💻 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss your ideas.  

---
