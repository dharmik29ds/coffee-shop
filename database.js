// database.js
// Sets up a local SQLite database file (coffee_shop.db) and seeds it
// with sample menu data the first time the server runs.

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "coffee_shop.db"));

db.pragma("journal_mode = WAL");

// ---------- Create tables ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    available INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT,
    customer_name TEXT,
    status TEXT DEFAULT 'pending',
    total REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_order REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
`);

// ---------- Seed menu items only if table is empty ----------
const count = db.prepare("SELECT COUNT(*) AS c FROM menu_items").get().c;

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO menu_items (name, description, price, category, image_url)
    VALUES (@name, @description, @price, @category, @image_url)
  `);

  const items = [
    { name: "Espresso", description: "Rich double shot of espresso", price: 2.75, category: "Hot Coffee", image_url: "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400" },
    { name: "Cappuccino", description: "Espresso with steamed milk and foam", price: 3.75, category: "Hot Coffee", image_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400" },
    { name: "Latte", description: "Espresso with smooth steamed milk", price: 4.00, category: "Hot Coffee", image_url: "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400" },
    { name: "Americano", description: "Espresso with hot water", price: 3.25, category: "Hot Coffee", image_url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400" },
    { name: "Iced Coffee", description: "Chilled coffee over ice", price: 3.50, category: "Cold Coffee", image_url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400" },
    { name: "Cold Brew", description: "Slow steeped, smooth and bold", price: 4.25, category: "Cold Coffee", image_url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
    { name: "Iced Latte", description: "Espresso, milk, and ice", price: 4.25, category: "Cold Coffee", image_url: "https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=400" },
    { name: "Matcha Latte", description: "Ceremonial grade matcha with milk", price: 4.75, category: "Specialty", image_url: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400" },
    { name: "Hot Chocolate", description: "Rich Belgian chocolate, steamed milk", price: 3.95, category: "Specialty", image_url: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400" },
    { name: "Croissant", description: "Buttery, flaky, baked fresh daily", price: 3.25, category: "Bakery", image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400" },
    { name: "Blueberry Muffin", description: "Loaded with fresh blueberries", price: 3.50, category: "Bakery", image_url: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400" },
    { name: "Avocado Toast", description: "Sourdough, smashed avocado, chili flakes", price: 6.50, category: "Bakery", image_url: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400" }
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(items);

  console.log(`Seeded ${items.length} menu items into coffee_shop.db`);
}

module.exports = db;
