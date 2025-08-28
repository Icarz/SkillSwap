const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
// 1. Import required modules for Socket.io
const http = require("http");
const socketIo = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Initialize the app
dotenv.config();
const app = express();

// --- Socket.IO Setup ---
// 2. Create HTTP server for Socket.io
const server = http.createServer(app);

// 3. Initialize Socket.io with CORS config
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// 4. Socket.io connection handling
io.on("connection", (socket) => {
  // console.log('🔌 User connected:', socket.id);

  // Join user-specific room for private messaging
  socket.on("join-user-room", (userId) => {
    socket.join(userId);
    // console.log(`👤 User ${userId} joined their room`);
  });

  // Handle sending messages in real-time
  socket.on("send-message", (messageData) => {
    // Broadcast message to recipient's room
    socket.to(messageData.receiver).emit("receive-message", messageData);
    // console.log("✉️ Message sent via Socket.IO:", messageData._id);
  });

  socket.on("disconnect", () => {
    // console.log("🔌 User disconnected:", socket.id);
  });
});

// 5. Make io accessible in routes if needed
app.set("io", io);

// --- Your Existing Code Below ---
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
  })
);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
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
