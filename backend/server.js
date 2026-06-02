const express = require("express");
const cors = require("cors");

const app = express();

// ✅ CORS (مهم جداً)
app.use(cors({
  origin: "https://hexashield-three.vercel.app", // غيره لرابط موقعك
  methods: ["GET", "POST"],
  credentials: true
}));

// ✅ parsing JSON
app.use(express.json());

// ✅ test route
app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

// ✅ API test
app.get("/api", (req, res) => {
  res.send("API is working 🚀");
});

// ✅ LOGIN API (الأهم)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.json({
      success: true,
      message: "Login success ✅"
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid credentials ❌"
  });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});