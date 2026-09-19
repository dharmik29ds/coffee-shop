// public/js/main.js
// Loads a handful of menu items from the database (via the API) to show
// on the landing page.

async function loadMenuPreview() {
  const container = document.getElementById("menu-preview");
  try {
    const res = await fetch("/api/menu");
    const items = await res.json();

    const preview = items.slice(0, 6);

    container.innerHTML = preview
      .map(
        (item) => `
      <div class="menu-card">
        <img src="${item.image_url}" alt="${item.name}" />
        <div class="info">
          <h3>${item.name}</h3>
          <p>${item.description || ""}</p>
          <div class="price">$${item.price.toFixed(2)}</div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    container.innerHTML = "<p>Menu is loading… make sure the server is running.</p>";
    console.error(err);
  }
}

loadMenuPreview();
