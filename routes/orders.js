// routes/orders.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// POST /api/orders - create a new order (called from the QR-code order page)
// body: { table_number, customer_name, items: [{ menu_item_id, quantity, notes }] }
router.post("/", (req, res) => {
  const { table_number, customer_name, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must include at least one item" });
  }

  const getItem = db.prepare("SELECT * FROM menu_items WHERE id = ?");
  const insertOrder = db.prepare(
    `INSERT INTO orders (table_number, customer_name, total) VALUES (?, ?, ?)`
  );
  const insertOrderItem = db.prepare(
    `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order, notes)
     VALUES (?, ?, ?, ?, ?)`
  );

  const createOrder = db.transaction(() => {
    let total = 0;
    const validated = [];

    for (const it of items) {
      const menuItem = getItem.get(it.menu_item_id);
      if (!menuItem) throw new Error(`Menu item ${it.menu_item_id} not found`);
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      total += menuItem.price * qty;
      validated.push({ menuItem, qty, notes: it.notes || "" });
    }

    const orderResult = insertOrder.run(
      table_number || "N/A",
      customer_name || "Guest",
      Number(total.toFixed(2))
    );
    const orderId = orderResult.lastInsertRowid;

    for (const v of validated) {
      insertOrderItem.run(orderId, v.menuItem.id, v.qty, v.menuItem.price, v.notes);
    }

    return { orderId, total: Number(total.toFixed(2)) };
  });

  try {
    const result = createOrder();
    res.status(201).json({ success: true, order_id: result.orderId, total: result.total });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders - list orders (for the kitchen/admin dashboard), newest first
router.get("/", (req, res) => {
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100")
    .all();

  const getItems = db.prepare(`
    SELECT oi.quantity, oi.price_at_order, oi.notes, mi.name
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE oi.order_id = ?
  `);

  const withItems = orders.map((o) => ({
    ...o,
    items: getItems.all(o.id)
  }));

  res.json(withItems);
});
router.get("/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});
// PUT /api/orders/:id/status - update order status (pending -> preparing -> ready -> completed)
router.put("/:id/status", (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "preparing", "ready", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
  }
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
