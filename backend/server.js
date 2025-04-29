const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require('./routes/authRoutes');

// initialize the app //
dotenv.config();
const app = express();
//--------------------------------//
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(cors());
//--------------------------------//


// Create a basic route (to test the server) //
app.get("/", (req, res) => {
  res.send("SkillSwap API is running...");
});

// Connect to MongoDB //
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Start the server

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
