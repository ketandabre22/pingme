# PingMe: Scalable Real-Time Chat Application

PingMe is a production-grade, full-stack, real-time messaging application inspired by WhatsApp. Built with a modern architecture to support high concurrency, real-time interactions, and horizontal scalability.

## 🚀 Tech Stack

- **Frontend:** React, Vite, React Router, Zustand, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Real-Time:** Socket.io
- **Caching & Scalability:** Redis Pub/Sub (ioredis)
- **Authentication:** JWT, bcrypt

## 🛠 Features

- **Authentication:** Secure login and signup using JWT.
- **Real-Time Messaging:** Instant message delivery using Socket.io.
- **Typing Indicators:** See when the other person is typing in real-time.
- **Online Presence:** Dynamic online/offline statuses and "last seen" timestamps.
- **Chat Management:** Search for users and start private 1-on-1 conversations.
- **Modern UI/UX:** Sleek, responsive dark mode design featuring glassmorphism aesthetics.
- **Scalable Architecture:** Designed to scale horizontally across multiple servers using Redis Pub/Sub.

---

## 💻 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas URI)
- Redis (Optional for local dev, but required for multi-node production)

### 1. Clone & Install Dependencies
Navigate into the backend and frontend directories and install the dependencies:
```bash
# Terminal 1 - Backend
cd backend
npm install

# Terminal 2 - Frontend
cd frontend
npm install
```

### 2. Environment Variables
Create `.env` files in both the `backend` and `frontend` directories based on the provided `.env.example` files.

**backend/.env**:
```env
NODE_ENV=development
PORT=5009
MONGO_URI=mongodb://127.0.0.1:27017/whatsapp-clone
JWT_SECRET=supersecretjwtkey_change_in_production
FRONTEND_URL=http://localhost:5173
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**frontend/.env**:
```env
VITE_API_URL=http://localhost:5009
```

### 3. Run the Application
Start both development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🏗 System Design: Scaling with Redis Pub/Sub

In a single-server architecture, Socket.io manages connections and state in the memory of a single Node.js process. When user A sends a message to user B, the server simply finds user B's socket and emits the event. 

However, as traffic grows, a single Node.js server cannot handle millions of active WebSocket connections. You must scale horizontally by adding more servers behind a load balancer. 

**The Problem:** If User A is connected to Server 1 and User B is connected to Server 2, Server 1 does not have access to User B's socket. The message would not be delivered.

**The Solution:** Redis Pub/Sub acts as the central nervous system connecting all the isolated backend servers.
1. When User A sends a message on Server 1, Server 1 handles the HTTP/Socket request.
2. Server 1 uses the `@socket.io/redis-adapter` to publish the message event to a specific Redis Channel.
3. Server 2 (and any other server in the cluster) is subscribed to this Redis Channel.
4. Server 2 receives the event from Redis, checks its local memory for User B's socket, and delivers the message to User B.

This pub/sub architecture guarantees that socket events are correctly routed to the intended client, regardless of which backend server they are currently connected to.

---

## 📄 Resume Bullet Points

If you are adding this project to your resume, consider using these high-impact bullet points to highlight your engineering capabilities:

* Architected and deployed a full-stack, real-time messaging application using **React**, **Node.js**, **Express**, and **MongoDB**, supporting secure 1-on-1 private channels.
* Implemented real-time bi-directional communication using **Socket.io**, enabling instant message delivery, dynamic typing indicators, and live presence tracking.
* Designed the system for horizontal scalability by integrating **Redis Pub/Sub** via the Socket.io Redis adapter, allowing the backend to handle high-concurrency websocket connections across multiple server instances.
* Engineered a secure authentication flow leveraging **JWT** and **bcrypt**, with custom Axios interceptors to automatically manage token lifecycle and protected routes.
* Developed a responsive, premium user interface utilizing a custom vanilla CSS design system featuring modern glassmorphism, managed globally via **Zustand** state container.
# pingme
