const express = require("express");
const cors = require("cors");

const app = express();

// 🔥 CORS CONFIG (الأهم)
app.use(cors({
  origin: [
    "https://hexashield-three.vercel.app", // رابط موقعك على Vercel
    "http://localhost:5174" // للتطوير المحلي (اختياري)
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

// مثال API
app.post("/login", (req, res) => {
  res.json({ message: "Login success ✅" });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});