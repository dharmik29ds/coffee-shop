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
  const tableNumber = document.getElementById("table-number").value.trim();
    
    if (!tableNumber) {
        showToast("Tamare table number nakhavo enter table no & your name!", true);
        return;
    }

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
function filterMenu(category) {
    // 1. Active button style change કરવા માટે
    const buttons = document.querySelectorAll('.category-tabs .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // 2. Direct clean filtering logic
    const items = document.querySelectorAll('.item-row');
    items.forEach(item => {
        const itemCategory = (item.getAttribute('data-category') || '').toLowerCase().trim();
        const targetCategory = category.toLowerCase().trim();

        if (targetCategory === 'all' || itemCategory === targetCategory) {
            item.style.setProperty('display', 'flex', 'important');
        } else {
            item.style.setProperty('display', 'none', 'important');
        }
    });
}
// Slide-over Cart Drawer Logic
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');

// Cart Drawer Open કરવા માટેનું ફંક્શન
function openCartDrawer() {
    if (cartDrawer) cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('active');
}

// Cart Drawer Close કરવા માટેનું ફંક્શન
function closeCartDrawer() {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('active');
}

// Close બટન કે Overlay પર ક્લિક કરવાથી બંધ થઈ જાય
if (closeCart) {
    closeCart.addEventListener('click', closeCartDrawer);
}
if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCartDrawer);
}
    const openCartTrigger = document.querySelector('.place-order-btn'); // અથવા તારું કાર્ટ બટન હોય તો એની ક્લાસ
if (openCartTrigger) {
    openCartTrigger.addEventListener('click', openCartDrawer);
}
// ઓર્ડર પેજ પર રહેલા 'Place Order' કે કાર્ટ બટન સાથે ડ્રોઅર લિંક કરવા માટે
const placeOrderBtn = document.querySelector('.place-order-btn'); 
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', function(e) {
        // જો તારે ઓર્ડર પ્લેસ કરતી વખતે જ ડ્રોઅર ખોલવું હોય તો અહીં ફંક્શન કોલ કરી શકાય
        openCartDrawer();
    });
}



    