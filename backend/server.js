const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("./app");

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.join(socket.user.id);
  socket.on("join-user-room", () => { socket.join(socket.user.id); });
  socket.on("disconnect", () => {});
});

app.set("io", io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Socket.IO is enabled and listening for connections");
});
