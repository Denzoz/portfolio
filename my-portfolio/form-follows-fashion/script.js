const productGrid = document.getElementById("productGrid");
const productCards = [...document.querySelectorAll(".product-card")];
const filterButtons = [...document.querySelectorAll(".filter-button")];
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");

let activeFilter = "all";
let searchTerm = "";
let toastTimer;
const cart = new Map();

function formatMoney(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES", maximumFractionDigits: 0
  }).format(amount).replace("KES", "KSh");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function applyFilters() {
  let visible = 0;
  productCards.forEach((card) => {
    const categories = card.dataset.category.split(" ");
    const name = card.dataset.name.toLowerCase();
    const matchesFilter = activeFilter === "all" || categories.includes(activeFilter);
    const matchesSearch = name.includes(searchTerm);
    const show = matchesFilter && matchesSearch;
    card.hidden = !show;
    if (show) visible++;
  });
  resultCount.textContent = `${visible} product${visible === 1 ? "" : "s"}`;
  emptyState.hidden = visible !== 0;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("selected", item === button));
    applyFilters();
  });
});

document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", () => {
    activeFilter = card.dataset.filter;
    filterButtons.forEach((button) => button.classList.toggle("selected", button.dataset.filter === activeFilter));
    applyFilters();
  });
});

document.getElementById("searchToggle").addEventListener("click", () => {
  searchPanel.hidden = !searchPanel.hidden;
  if (!searchPanel.hidden) searchInput.focus();
});
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  applyFilters();
});
document.getElementById("searchClear").addEventListener("click", () => {
  searchInput.value = "";
  searchTerm = "";
  applyFilters();
  searchInput.focus();
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const cartDrawer = document.getElementById("cartDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.hidden = true;
  document.body.classList.remove("drawer-open");
}
document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
drawerBackdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    searchPanel.hidden = true;
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const entries = [...cart.entries()];
  const count = entries.reduce((sum, [, item]) => sum + item.quantity, 0);
  const total = entries.reduce((sum, [, item]) => sum + item.price * item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = formatMoney(total);

  if (entries.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your bag is empty. Find something you love.</p>';
    return;
  }
  cartItems.innerHTML = entries.map(([name, item]) => `
    <div class="cart-item">
      <div>
        <h3>${escapeHTML(name)}</h3>
        <p>${formatMoney(item.price)} each</p>
        <div class="quantity-controls">
          <button type="button" data-action="decrease" data-name="${escapeHTML(name)}" aria-label="Decrease ${escapeHTML(name)} quantity">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" data-name="${escapeHTML(name)}" aria-label="Increase ${escapeHTML(name)} quantity">+</button>
        </div>
      </div>
      <button type="button" class="remove-item" data-action="remove" data-name="${escapeHTML(name)}">Remove</button>
    </div>`).join("");
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

document.querySelectorAll(".add-button").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.product;
    const price = Number(button.dataset.price);
    if (cart.has(name)) cart.get(name).quantity += 1;
    else cart.set(name, { price, quantity: 1 });
    renderCart();
    showToast(`${name} added to your bag`);
  });
});

document.getElementById("cartItems").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, name } = button.dataset;
  if (!cart.has(name)) return;
  const item = cart.get(name);
  if (action === "increase") item.quantity++;
  if (action === "decrease") item.quantity--;
  if (action === "remove" || item.quantity <= 0) cart.delete(name);
  renderCart();
});

document.getElementById("checkoutButton").addEventListener("click", () => {
  const message = document.getElementById("checkoutMessage");
  if (cart.size === 0) {
    message.textContent = "Your bag is empty. Add a product first.";
    return;
  }
  const lines = [...cart.entries()].map(([name, item]) =>
    `${item.quantity} × ${name} — ${formatMoney(item.price * item.quantity)}`
  );
  const total = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderText = `Hello Form Follows Fashion, I'd like to enquire about this order:\n${lines.join("\n")}\nSubtotal: ${formatMoney(total)}\nPlease confirm availability, sizes, delivery options and payment details.`;
  message.textContent = "Your order summary is ready. Connect your store WhatsApp number to enable sending.";
  const whatsappNumber = ""; 
  if (whatsappNumber) {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText)}`, "_blank", "noopener");
  } else {
    showToast("Demo cart only — add your WhatsApp number in script.js to take orders.");
  }
});

document.getElementById("newsletterForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = document.getElementById("emailInput");
  document.getElementById("newsletterMessage").textContent =
    `Thanks! for subscribing`;
  emailInput.value = "";
});

document.getElementById("year").textContent = new Date().getFullYear();
renderCart();
applyFilters();
