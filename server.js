// server.js
const PORT = process.env.PORT || 3000;
const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();
app.use(session({
    secret: "coffee-shop-super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
});

// API routes ---
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// Page routes ---
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/order", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "order.html"));
});

// Login API
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "kitchen123") {
        req.session.isLoggedIn = true;
        return res.status(200).send({ success: true });
    }
    res.status(401).send({ success: false });
});

// Authentication Middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        return next();
    }
    res.sendFile(path.join(__dirname, "public", "login.html"));
};

// Protected Kitchen Dashboard Route
app.get("/kitchen-dashboard", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.listen(PORT, () => {
    console.log(`Server is running on port `+PORT);
});
