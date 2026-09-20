// public/js/order.js
// Powers the customer-facing order page: loads menu from the API,
// manages a cart in memory, and submits the order to /api/orders
// which writes it into the SQLite database.

let menuItems = [];
let cart = {}; // { menu_item_id: quantity }
let activeCategory = "All";

const menuListEl = document.getElementById("menu-list");
const tabsEl = document.getElementById("category-tabs");
const totalEl = document.getElementById("cart-total");
const submitBtn = document.getElementById("submit-order");
const toastEl = document.getElementById("toast");

function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.className = "toast" + (isError ? " error" : "");
  toastEl.style.display = "block";
  setTimeout(() => (toastEl.style.display = "none"), 3000);
}

async function loadMenu() {
  try {
    const res = await fetch("/api/menu");
    menuItems = await res.json();
    renderCategoryTabs();
    renderMenu();
  } catch (err) {
    menuListEl.innerHTML = "<p>Could not load the menu. Is the server running?</p>";
    console.error(err);
  }
}

function renderCategoryTabs() {
  const categories = ["All", ...new Set(menuItems.map((i) => i.category))];
  tabsEl.innerHTML = categories
    .map(
      (cat) =>
        `<button data-cat="${cat}" class="${cat === activeCategory ? "active" : ""}">${cat}</button>`
    )
    .join("");

  tabsEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderCategoryTabs();
      renderMenu();
    });
  });
}
function renderMenu() {
    const filtered =
        activeCategory === "All"
            ? menuItems
            : menuItems.filter((i) => i.category === activeCategory);

    menuListEl.innerHTML = filtered
        .map((item) => {
            const qty = cart[item.id] || 0;
            return `
                <div class="item-row" data-category="${item.category}">
                    <img src="${item.image_url}" alt="${item.name}" />
                    <div class="item-info">
                        <h3>${item.name}</h3>
                        <p>${item.description || ""}</p>
                        <div class="price">$${item.price.toFixed(2)}</div>
                    </div>
                    <div class="qty-control">
                        <button onclick="changeQty(${item.id}, -1)">-</button>
                        <span id="qty-${item.id}">${qty}</span>
                        <button onclick="changeQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            `;
        })
        .join("");
}

function changeQty(itemId, delta) {
  const current = cart[itemId] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete cart[itemId];
  else cart[itemId] = next;

  document.getElementById(`qty-${itemId}`).textContent = next;
  updateTotal();
}

function updateTotal() {
  let total = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const item = menuItems.find((i) => i.id == id);
    if (item) total += item.price * qty;
  }
  totalEl.textContent = total.toFixed(2);
  submitBtn.disabled = total === 0;
}

async function submitOrder() {
  const items = Object.entries(cart).map(([menu_item_id, quantity]) => ({
    menu_item_id: Number(menu_item_id),
    quantity
  }));

  if (items.length === 0) return;

  const payload = {
    table_number: document.getElementById("table-number").value.trim(),
    customer_name: document.getElementById("customer-name").value.trim(),
    items
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Placing order…";

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Order failed");
      showToast(`Order #${data.order_id} placed! Total: $${data.total.toFixed(2)}`);
      startTrackingOrder(data.order_id);
      cart = {};
      renderMenu();
      updateTotal();

  } catch (err) {
    showToast(err.message, true);
    submitBtn.disabled = false;
  } finally {
    submitBtn.textContent = "Place Order";
  }
}

submitBtn.addEventListener("click", submitOrder);

loadMenu();
let statusInterval;

function startTrackingOrder(orderId) {
  const statusBox = document.getElementById('order-status-box');
  const statusText = document.getElementById('current-status');
  if (statusBox) statusBox.style.display = 'block';

  if (statusInterval) clearInterval(statusInterval);

  statusInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const order = await res.json();
        if (statusText) statusText.innerText = order.status.toUpperCase();

        if (order.status === 'completed' || order.status === 'ready') {
          if (statusText) statusText.style.color = '#16a34a';
        }
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
    }
  }, 3000);
}
// Category Filter Function
function filterMenu(category) {
    // Active button style change કરવા માટે
    const buttons = document.querySelectorAll('.category-tabs .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Menu items ને ફિલ્ટર કરવા માટે
    const items = document.querySelectorAll('.menu-item, .menu-card'); 
    items.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}