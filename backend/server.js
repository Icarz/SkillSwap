const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
// 1. Import required modules for Socket.io
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Initialize the app
const app = express();

// --- Socket.IO Setup ---
// 2. Create HTTP server for Socket.io
const server = http.createServer(app);

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

// 3. Initialize Socket.io with CORS config
const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// 4a. Socket.io authentication middleware — reject connections without a valid JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach verified user to socket
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// 4b. Socket.io connection handling
io.on("connection", (socket) => {
  // Auto-join the verified user's personal room
  socket.join(socket.user.id);

  // Allow client to explicitly re-join (e.g. after reconnect) — always uses verified id
  socket.on("join-user-room", () => {
    socket.join(socket.user.id);
  });

  socket.on("disconnect", () => {
    // cleanup handled automatically by socket.io
  });
});

// 5. Make io accessible in routes if needed
app.set("io", io);

// --- Your Existing Code Below ---

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", messageRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("SkillSwap API is running...");
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// 6. Change from app.listen to server.listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Socket.IO is enabled and listening for connections");
});
