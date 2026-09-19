// routes/menu.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// GET /api/menu - list all available menu items (optionally filter by category)
router.get("/", (req, res) => {
  const { category } = req.query;
  let items;

  if (category) {
    items = db
      .prepare("SELECT * FROM menu_items WHERE available = 1 AND category = ? ORDER BY name")
      .all(category);
  } else {
    items = db
      .prepare("SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name")
      .all();
  }

  res.json(items);
});

// GET /api/menu/categories - distinct list of categories
router.get("/categories", (req, res) => {
  const rows = db
    .prepare("SELECT DISTINCT category FROM menu_items WHERE available = 1 ORDER BY category")
    .all();
  res.json(rows.map((r) => r.category));
});

// POST /api/menu - add a new menu item (simple admin use)
router.post("/", (req, res) => {
  const { name, description, price, category, image_url } = req.body;

  if (!name || price == null || !category) {
    return res.status(400).json({ error: "name, price, and category are required" });
  }

  const result = db
    .prepare(
      `INSERT INTO menu_items (name, description, price, category, image_url)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, description || "", price, category, image_url || "");

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/menu/:id/availability - toggle sold out / available
router.put("/:id/availability", (req, res) => {
  const { available } = req.body;
  db.prepare("UPDATE menu_items SET available = ? WHERE id = ?").run(
    available ? 1 : 0,
    req.params.id
  );
  res.json({ success: true });
});

module.exports = router;
