// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

require("./database"); // ensures DB + tables + seed data exist before routes load

const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
// ---------- API routes ----------
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// ---------- Page routes ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/kitchen-secret-99", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`\n☕  Coffee shop server running at http://localhost:${PORT}`);
  console.log(`   Order page (what the QR code links to): http://localhost:${PORT}/order`);
  console.log(`   Kitchen/admin dashboard: http://localhost:${PORT}/admin\n`);
});
