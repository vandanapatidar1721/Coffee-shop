const API_BASE = "http://localhost:5000";
let productsCatalog = [];

function completeLoginSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", data.userId);
  localStorage.setItem("loggedInUser", data.email);
  localStorage.setItem("loggedInName", data.name || "");
  updateAuthUI();
  loadCart();
  loadFavorites();
  loadOrders();
  prefillBookingForm();
}

function isLoggedIn() {
  return Boolean(localStorage.getItem("token") && localStorage.getItem("userId"));
}

function openLoginModal() {
  const loginModal = document.getElementById("login-modal");
  if (loginModal) {
    loginModal.classList.remove("hidden");
  }
}

function requireLogin(message) {
  if (isLoggedIn()) return true;
  showToast("Please log in or sign up first.", "warning")
  openLoginModal();
  return false;
}

function logoutUser(showMessage = true) {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("loggedInName");
  cartItems = [];
  favItems = [];
  userOrders = [];
  updateCartUI();
  updateFavUI();
  updateOrdersUI();
  updateAuthUI();
  if (showMessage) {
    showToast("You have been logged out.", "warning");
  }
}

async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) {
      logoutUser(false);
      throw new Error(data.message || "Please log in again.");
    }
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function formatPrice(value) {
  const num = parseFloat(String(value).replace(/[₹$,]/g, ""));
  if (Number.isNaN(num)) return String(value);
  return `₹${num.toFixed(2)}`;
}

function parsePriceText(text) {
  return parseFloat(String(text).replace(/[₹$,]/g, "")) || 0;
}

function findCatalogProduct(name) {
  const normalized = name.trim().toLowerCase();
  return productsCatalog.find((p) => p.name.trim().toLowerCase() === normalized);
}

function getProductFromCard(card) {
  const img = card.querySelector("img");
  const titleEl = card.querySelector(".tittle, .title");
  const amountEl = card.querySelector(".amount");
  const name = titleEl ? titleEl.innerText.trim() : "Product";
  const priceText = amountEl ? amountEl.innerText.trim() : "₹0";
  const price = parsePriceText(priceText);
  const image = img ? img.getAttribute("src") : "";
  const catalogMatch = findCatalogProduct(name);
  const id = card.dataset.productId || (catalogMatch ? String(catalogMatch.id) : String(name));

  if (!card.dataset.productId) {
    card.dataset.productId = id;
  }

  return { id, name, price, priceText, image };
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  container.style.cssText = `
    position: fixed; top: 24px; left: 24px;
    display: flex; flex-direction: column; gap: 8px;
    z-index: 99999; max-width: 320px;
  `;

  const colors = {
    success: { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46" },
    error:   { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
    info:    { bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e" },
    warning: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: ${c.bg}; border: 1px solid ${c.border}; color: ${c.text};
    padding: 12px 16px; border-radius: 8px; font-size: 14px; line-height: 1.5;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    transform: translateY(-8px); max-width: 100%;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

async function loadProductsCatalog() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) return;
    productsCatalog = await response.json();
    document.querySelectorAll(".card").forEach((card) => {
      const titleEl = card.querySelector(".tittle, .title");
      if (!titleEl) return;
      const match = findCatalogProduct(titleEl.innerText.trim());
      if (match) {
        card.dataset.productId = String(match.id);
      }
    });
  } catch {
    /* menu still works with name matching */
  }
}

/* ---------- Hamburger ---------- */
const hamburger = document.querySelector(".hamburger");
const navList = document.querySelector(".navlist");

if (hamburger && navList) {
  hamburger.addEventListener("click", (e) => {
    e.preventDefault();
    navList.classList.toggle("active");
  });

  navList.querySelectorAll(".link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 992) {
        navList.classList.remove("active");
      }
    });
  });
}

/* ---------- Cart ---------- */
const cartIcon = document.getElementById("cart-icon");
const cartSidebar = document.getElementById("cart-sidebar");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartOverlay = document.getElementById("cart-overlay");
const addToCartButtons = document.querySelectorAll(".add-to-cart");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartTotalPriceEl = document.getElementById("cart-total-price");
const cartItemCountEl = document.getElementById("cart-item-count");
const buyNowBtn = cartSidebar ? cartSidebar.querySelector("button:not(.close-cart)") : null;

let cartItems = [];

function syncCartFromServer(data) {
  cartItems = (data.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    price: formatPrice(item.price),
    image: item.image,
    quantity: item.quantity || 1,
  }));
  updateCartUI();
}

async function loadCart() {
  if (!cartItemsContainer || !isLoggedIn()) {
    cartItems = [];
    updateCartUI();
    return;
  }
  try {
    const data = await apiRequest(`${API_BASE}/api/cart`);
    syncCartFromServer(data);
  } catch {
    /* keep local state */
  }
}

function updateCartUI() {
  if (!cartItemsContainer || !cartTotalPriceEl || !cartItemCountEl) return;

  cartItemsContainer.innerHTML = "";

  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML =
      '<p class="cart-empty-msg">Your cart is empty.</p>';
  } else {
    cartItems.forEach((item) => {
      cartItemsContainer.innerHTML += `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <p>${item.price}</p>
            <div class="cart-qty-controls">
              <button class="qty-btn qty-minus" type="button" aria-label="Decrease quantity">-</button>
              <span class="qty-value">${item.quantity || 1}</span>
              <button class="qty-btn qty-plus" type="button" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="remove-item-btn" type="button" aria-label="Remove item"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    });
  }

  const total = cartItems.reduce((sum, item) => {
    const price = parsePriceText(item.price);
    return sum + price * (item.quantity || 1);
  }, 0);

  cartTotalPriceEl.innerText = total.toFixed(2);
  cartItemCountEl.innerText = cartItems.reduce(
    (n, item) => n + (item.quantity || 1),
    0
  );

  cartItemsContainer.querySelectorAll(".remove-item-btn").forEach((btn) => {
    btn.addEventListener("click", removeCartItem);
  });

  cartItemsContainer.querySelectorAll(".qty-minus").forEach((btn) => {
    btn.addEventListener("click", updateCartQuantity);
  });

  cartItemsContainer.querySelectorAll(".qty-plus").forEach((btn) => {
    btn.addEventListener("click", updateCartQuantity);
  });
}

async function removeCartItem(e) {
  e.stopPropagation();
  const itemElement = e.currentTarget.closest(".cart-item");
  if (!itemElement) return;
  const itemId = itemElement.dataset.id;

  if (!requireLogin("Please log in to manage your cart.")) return;

  try {
    const data = await apiRequest(`${API_BASE}/api/cart/remove`, {
      method: "POST",
      body: JSON.stringify({ id: itemId }),
    });
    syncCartFromServer(data);
  } catch (err) {
    showToast(err.message || "Could not remove item.", "error");
  }
}

async function updateCartQuantity(e) {
  e.stopPropagation();
  const itemElement = e.currentTarget.closest(".cart-item");
  if (!itemElement) return;
  const itemId = itemElement.dataset.id;
  const item = cartItems.find((entry) => String(entry.id) === String(itemId));
  if (!item) return;

  const isPlus = e.currentTarget.classList.contains("qty-plus");
  const nextQty = (item.quantity || 1) + (isPlus ? 1 : -1);

  if (!requireLogin("Please log in to manage your cart.")) return;

  if (nextQty < 1) {
    try {
      const data = await apiRequest(`${API_BASE}/api/cart/remove`, {
        method: "POST",
        body: JSON.stringify({ id: itemId }),
      });
      syncCartFromServer(data);
    } catch (err) {
      showToast(err.message || "Could not update cart.", "error");
    }
    return;
  }

  try {
    const data = await apiRequest(`${API_BASE}/api/cart/update-quantity`, {
      method: "POST",
      body: JSON.stringify({ id: itemId, quantity: nextQty }),
    });
    syncCartFromServer(data);
  } catch (err) {
    showToast(err.message || "Could not update quantity.", "error");
  }
}

if (cartIcon && cartSidebar && closeCartBtn && cartOverlay) {
  const openCart = () => {
    cartSidebar.classList.add("open");
    cartOverlay.classList.add("open");
  };

  const closeCart = () => {
    cartSidebar.classList.remove("open");
    cartOverlay.classList.remove("open");
  };

  cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    if (!requireLogin("Please log in to view your cart.")) return;
    openCart();
  });

  closeCartBtn.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  const addItemToCart = async (e) => {
    if (!requireLogin("Please log in to add items to your cart.")) return;

    const card = e.target.closest(".card");
    if (!card) return;

    const product = getProductFromCard(card);

    try {
      const data = await apiRequest(`${API_BASE}/api/cart/add`, {
        method: "POST",
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        }),
      });
      syncCartFromServer(data);
      showToast(`${product.name} added to cart!`, "success");
    } catch (err) {
      showToast(err.message || "Could not add to cart. Is the server running?", "error");
    }
  };

  addToCartButtons.forEach((button) => {
    button.addEventListener("click", addItemToCart);
  });

  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!requireLogin("Please log in to checkout.")) return;
      if (cartItems.length === 0) {
        showToast("Your cart is empty.", "warning");
        return;
      }
      try {
        const data = await apiRequest(`${API_BASE}/api/cart/checkout`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        syncCartFromServer(data.cart);
        closeCart();
        showToast(data.message || "Order placed!", "success");
        loadOrders();
      } catch (err) {
        showToast(err.message || "Checkout failed.", "error");
      }
    });
  }

  loadCart();
}

/* ---------- Favorites ---------- */
const favIcon = document.getElementById("fav-icon");
const favSidebar = document.getElementById("fav-sidebar");
const closeFavBtn = document.getElementById("close-fav-btn");
const favItemsContainer = document.getElementById("fav-items-container");
const favItemCountEl = document.getElementById("fav-item-count");

let favItems = [];
let userOrders = [];

function mapFavItems(items) {
  return (items || []).map((item) => ({
    id: item.id,
    name: item.name,
    price: formatPrice(item.price),
    image: item.image,
  }));
}

function updateFavUI() {
  if (favItemCountEl) {
    favItemCountEl.innerText = favItems.length;
  }

  if (!favItemsContainer) return;

  if (favItems.length === 0) {
    favItemsContainer.innerHTML =
      '<p class="cart-empty-msg">No favorites yet.</p>';
    return;
  }

  favItemsContainer.innerHTML = favItems
    .map(
      (item) => `
    <div class="cart-item fav-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>${item.price}</p>
        <button class="add-fav-to-cart-btn" type="button">Add to cart</button>
      </div>
      <button class="remove-fav-btn" type="button" aria-label="Remove favorite"><i class="fa-solid fa-trash"></i></button>
    </div>`
    )
    .join("");

  favItemsContainer.querySelectorAll(".remove-fav-btn").forEach((btn) => {
    btn.addEventListener("click", removeFavoriteItem);
  });

  favItemsContainer.querySelectorAll(".add-fav-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", addFavoriteItemToCart);
  });

  document.querySelectorAll(".card").forEach((card) => {
    const product = getProductFromCard(card);
    const heart = card.querySelector(".card-content .fa-heart");
    if (heart) {
      const isFav = favItems.some((f) => String(f.id) === String(product.id));
      heart.classList.toggle("fav-active", isFav);
    }
  });
}

async function loadFavorites() {
  if (!favItemsContainer && !favItemCountEl) return;
  if (!isLoggedIn()) {
    favItems = [];
    updateFavUI();
    return;
  }
  try {
    const data = await apiRequest(`${API_BASE}/api/favorites`);
    favItems = mapFavItems(data.items);
    updateFavUI();
  } catch {
    /* ignore */
  }
}

function isFavorite(productId) {
  return favItems.some((f) => String(f.id) === String(productId));
}

async function addToFavorites(card) {
  if (!requireLogin("Please log in to add favorites.")) return;

  const product = getProductFromCard(card);

  try {
    const data = await apiRequest(`${API_BASE}/api/favorites/add`, {
      method: "POST",
      body: JSON.stringify({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      }),
    });
    favItems = mapFavItems(data.items);
    updateFavUI();
    showToast(`${product.name} added to favorites!`, "success");
  } catch (err) {
    showToast(err.message || "Could not add to favorites.", "error");
  }
}

async function removeFromFavoritesById(itemId) {
  if (!requireLogin("Please log in to manage favorites.")) return;

  try {
    const data = await apiRequest(`${API_BASE}/api/favorites/remove`, {
      method: "POST",
      body: JSON.stringify({ id: itemId }),
    });
    favItems = mapFavItems(data.items);
    updateFavUI();
  } catch (err) {
    showToast(err.message || "Could not remove favorite.", "error");
  }
}

async function removeFavoriteItem(e) {
  e.preventDefault();
  e.stopPropagation();
  const itemEl = e.currentTarget.closest(".fav-item");
  if (!itemEl) return;
  await removeFromFavoritesById(itemEl.dataset.id);
}

async function addFavoriteItemToCart(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!requireLogin("Please log in to add items to your cart.")) return;

  const itemEl = e.currentTarget.closest(".fav-item");
  if (!itemEl) return;

  const fav = favItems.find((entry) => String(entry.id) === String(itemEl.dataset.id));
  if (!fav) return;

  try {
    const data = await apiRequest(`${API_BASE}/api/cart/add`, {
      method: "POST",
      body: JSON.stringify({
        id: fav.id,
        name: fav.name,
        price: parsePriceText(fav.price),
        image: fav.image,
      }),
    });
    syncCartFromServer(data);
    showToast(`${fav.name} added to cart!`, "success");
  } catch (err) {
    showToast(err.message || "Could not add to cart.", "error");
  }
}

async function toggleFavorite(card) {
  if (!requireLogin("Please log in to manage favorites.")) return;

  const product = getProductFromCard(card);
  if (isFavorite(product.id)) {
    await removeFromFavoritesById(product.id);
  } else {
    await addToFavorites(card);
  }
}

if (favIcon && favSidebar) {
  favIcon.addEventListener("click", (e) => {
    e.preventDefault();
    if (!requireLogin("Please log in to view your favorites.")) return;
    favSidebar.classList.add("open");
    if (cartOverlay) cartOverlay.classList.add("open");
  });
}

if (closeFavBtn && favSidebar) {
  closeFavBtn.addEventListener("click", () => {
    favSidebar.classList.remove("open");
    if (cartOverlay && !cartSidebar?.classList.contains("open")) {
      cartOverlay.classList.remove("open");
    }
  });
}

document.addEventListener("click", (e) => {
  const heart = e.target.closest(".card-content .fa-heart");
  if (!heart) return;
  e.preventDefault();
  const card = heart.closest(".card");
  if (card) toggleFavorite(card);
});

loadFavorites();

/* ---------- Orders ---------- */
function updateOrdersUI() {
  const ordersContainer = document.getElementById("orders-list");
  if (!ordersContainer) return;

  if (!isLoggedIn()) {
    ordersContainer.innerHTML = '<p class="orders-empty">Log in to see your orders.</p>';
    return;
  }

  if (!userOrders.length) {
    ordersContainer.innerHTML = '<p class="orders-empty">No orders yet.</p>';
    return;
  }

  ordersContainer.innerHTML = userOrders
    .map((order) => {
      const date = new Date(order.createdAt).toLocaleDateString();
      const itemsHtml = order.items
        .map(
          (item) =>
            `<li><span>${item.name}</span><span>${formatPrice(item.price)}${item.quantity > 1 ? ` x${item.quantity}` : ""}</span></li>`
        )
        .join("");
      return `
        <div class="order-card">
          <div class="order-card-header">
            <strong>Order</strong>
            <span>${date}</span>
          </div>
          <ul class="order-items">${itemsHtml}</ul>
          <p class="order-total">Total: ${formatPrice(order.total)}</p>
        </div>`;
    })
    .join("");
}

async function loadOrders() {
  if (!isLoggedIn()) {
    userOrders = [];
    updateOrdersUI();
    return;
  }
  try {
    const data = await apiRequest(`${API_BASE}/api/orders`);
    userOrders = data.orders || [];
    updateOrdersUI();
  } catch {
    userOrders = [];
    updateOrdersUI();
  }
}

/* ---------- Auth modal (login + sign up + logout) ---------- */
function updateAuthUI() {
  const menuIcon = document.getElementById("menu-icon");
  const loggedInBar = document.getElementById("auth-logged-in");
  const authForms = document.getElementById("auth-forms");

  if (menuIcon) {
    menuIcon.classList.toggle("user-logged-in", isLoggedIn());
    menuIcon.title = isLoggedIn()
      ? `Logged in as ${localStorage.getItem("loggedInUser") || "user"}`
      : "Login / Sign up";
  }

  if (loggedInBar && authForms) {
    if (isLoggedIn()) {
      loggedInBar.classList.remove("hidden");
      authForms.classList.add("hidden");
      const emailEl = document.getElementById("logged-in-email");
      if (emailEl) {
        emailEl.textContent = localStorage.getItem("loggedInUser") || "User";
      }
      updateOrdersUI();
    } else {
      loggedInBar.classList.add("hidden");
      authForms.classList.remove("hidden");
    }
  }
}

function setupAuthModal() {
  const loginModal = document.getElementById("login-modal");
  const menuIcon = document.getElementById("menu-icon");
  if (!loginModal || !menuIcon || loginModal.dataset.enhanced === "true") return;

  const box = loginModal.querySelector(".login-box");
  if (!box) return;

  box.innerHTML = `
    <div id="auth-logged-in" class="auth-logged-in hidden">
      <h2>My Account</h2>
      <p class="logged-in-label">Signed in as</p>
      <p id="logged-in-email" class="logged-in-email"></p>
      <button type="button" id="logout-btn" class="btn-logout">Logout</button>
      <div class="orders-section">
        <h3>My Orders</h3>
        <div id="orders-list" class="orders-list"></div>
      </div>
    </div>
    <div id="auth-forms">
      <div class="auth-tabs">
        <button type="button" class="auth-tab active" data-tab="login">Login</button>
        <button type="button" class="auth-tab" data-tab="signup">Sign Up</button>
      </div>
      <div id="login-panel" class="auth-panel">
        <h2>Sign in</h2>
        <input type="email" id="login-email" placeholder="Email" />
        <input type="password" id="login-password" placeholder="Password" />
        <button type="button" id="signin-btn">Sign in</button>
      </div>
      <div id="signup-panel" class="auth-panel hidden">
        <h2>Create account</h2>
        <input type="text" id="modal-name" placeholder="First name" />
        <input type="text" id="modal-lastName" placeholder="Last name" />
        <input type="email" id="modal-email" placeholder="Email" />
        <input type="tel" id="modal-phone" placeholder="Phone number" />
        <input type="password" id="modal-password" placeholder="Password" />
        <button type="button" id="modal-signup-btn">Sign up</button>
      </div>
    </div>
  `;

  loginModal.dataset.enhanced = "true";

  const loginPanel = box.querySelector("#login-panel");
  const signupPanel = box.querySelector("#signup-panel");

  box.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      box.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const isLogin = tab.dataset.tab === "login";
      loginPanel.classList.toggle("hidden", !isLogin);
      signupPanel.classList.toggle("hidden", isLogin);
    });
  });

  menuIcon.addEventListener("click", () => {
    loginModal.classList.toggle("hidden");
    updateAuthUI();
  });

  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) loginModal.classList.add("hidden");
  });

  box.querySelector("#logout-btn").addEventListener("click", () => {
    logoutUser(true);
    loginModal.classList.add("hidden");
  });

  box.querySelector("#signin-btn").addEventListener("click", async () => {
    const email = box.querySelector("#login-email").value.trim().toLowerCase();
    const password = box.querySelector("#login-password").value.trim();

    if (!email || !password) {
      showToast("Please enter email and password.", "warning");
      return;
    }

    try {
      const data = await apiRequest(`${API_BASE}/api/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      completeLoginSession(data);
      showToast(`Welcome, ${data.name || data.email}!`, "success");
      loginModal.classList.add("hidden");
    } catch (err) {
      showToast(err.message || "Login failed. Please check your email and password.", "error");
    }
  });

  box.querySelector("#modal-signup-btn").addEventListener("click", async () => {
    const payload = {
      name: box.querySelector("#modal-name").value.trim(),
      lastName: box.querySelector("#modal-lastName").value.trim(),
      email: box.querySelector("#modal-email").value.trim().toLowerCase(),
      phoneNumber: box.querySelector("#modal-phone").value.trim(),
      password: box.querySelector("#modal-password").value.trim(),
    };

    if (
      !payload.name ||
      !payload.lastName ||
      !payload.email ||
      !payload.phoneNumber ||
      !payload.password
    ) {
      showToast("Please fill in all sign-up fields.", "warning");
      return;
    }

    try {
      const data = await apiRequest(`${API_BASE}/api/signup`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast(data.message + " Login with your email and password.", "success");
      box.querySelector('[data-tab="login"]').click();
    } catch (err) {
      showToast(err.message || "Sign-up failed.", "error");
    }
  });

  updateAuthUI();
}

setupAuthModal();
updateAuthUI();

/* ---------- Service page sign-up form ---------- */
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: document.getElementById("name").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      phoneNumber: document.getElementById("phoneNumber").value.trim(),
      password: document.getElementById("signup-password")?.value.trim() || "",
    };

    try {
      const data = await apiRequest(`${API_BASE}/api/signup`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const loginData = await apiRequest(`${API_BASE}/api/login`, {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      });

      completeLoginSession(loginData);
      showToast(`${data.message} You are now logged in.`, "success");
      signupForm.reset();
    } catch (err) {
      showToast(err.message || "Sign-up failed. Please try again.", "error");
    }
  });
}

/* ---------- Newsletter ---------- */
const emailInput = document.getElementById("email");
if (emailInput && !signupForm) {
  const newsletterForm = emailInput.closest("form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) {
        showToast("Please enter your email.", "warning");
        return;
      }
      try {
        const data = await apiRequest(`${API_BASE}/api/newsletter`, {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        showToast(data.message, "success");
        emailInput.value = "";
      } catch (err) {
        showToast(err.message || "Subscription failed.", "error");
      }
    });
  }
}

/* ---------- Table booking ---------- */
function prefillBookingForm() {
  const nameInput = document.getElementById("booking-name");
  const emailInput = document.getElementById("booking-email");
  if (!nameInput || !emailInput || !isLoggedIn()) return;

  const name = localStorage.getItem("loggedInName");
  const email = localStorage.getItem("loggedInUser");

  if (name && !nameInput.value) nameInput.value = name;
  if (email && !emailInput.value) emailInput.value = email;
}

const tableBookingForm = document.getElementById("table-booking-form");
if (tableBookingForm) {
  const dateInput = document.getElementById("booking-date");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }

  prefillBookingForm();

  tableBookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!requireLogin("Please log in to book a table.")) return;

    const payload = {
      name: document.getElementById("booking-name").value.trim(),
      email: document.getElementById("booking-email").value.trim(),
      phone: document.getElementById("booking-phone").value.trim(),
      date: document.getElementById("booking-date").value,
      time: document.getElementById("booking-time").value,
      guests: document.getElementById("booking-guests").value,
    };

    try {
      const data = await apiRequest(`${API_BASE}/api/booking`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast(data.message, "success");
      tableBookingForm.reset();
      if (dateInput) {
        dateInput.min = new Date().toISOString().split("T")[0];
      }
    } catch (err) {
      showToast(err.message || "Could not book table. Is the server running?", "error");
    }
  });
}

/* ---------- Contact ---------- */
const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = contactForm.querySelectorAll("input");
    const textarea = contactForm.querySelector("textarea");

    try {
      const data = await apiRequest(`${API_BASE}/api/contact`, {
        method: "POST",
        body: JSON.stringify({
          name: inputs[0].value.trim(),
          email: inputs[1].value.trim(),
          subject: inputs[2].value.trim(),
          message: textarea.value.trim(),
        }),
      });
      showToast(data.message, "success");
      contactForm.reset();
    } catch (err) {
      showToast(err.message || "Could not send message.", "error");
    }
  });
}

/* ---------- Search (Menu page) ---------- */
function getMenuSearchQuery() {
  const menuInput = document.getElementById("menu-search-input");
  const navInput = document.getElementById("searchInput");
  const active = document.activeElement;
  if (active === menuInput && menuInput) return menuInput.value.toLowerCase().trim();
  if (active === navInput && navInput) return navInput.value.toLowerCase().trim();
  if (menuInput && menuInput.value.trim()) return menuInput.value.toLowerCase().trim();
  if (navInput) return navInput.value.toLowerCase().trim();
  return "";
}

function searchFunction() {
  const query = getMenuSearchQuery();
  const productList = document.getElementById("product-list");

  if (!productList) {
    if (query) {
      window.location.href = `MENU.html?search=${encodeURIComponent(query)}`;
    } else {
      window.location.href = "MENU.html";
    }
    return;
  }

  productList.querySelectorAll(".card").forEach((card) => {
    const dataName = (card.getAttribute("data-name") || "").toLowerCase();
    const title =
      card.querySelector(".tittle, .title")?.innerText.toLowerCase() || "";
    const match = !query || dataName.includes(query) || title.includes(query);
    card.classList.toggle("search-hidden", !match);
  });
}

window.searchFunction = searchFunction;

function syncMenuSearchInputs() {
  const menuInput = document.getElementById("menu-search-input");
  const navInput = document.getElementById("searchInput");
  if (!menuInput) return;

  const runSearch = () => searchFunction();

  menuInput.addEventListener("input", runSearch);
  menuInput.addEventListener("keyup", runSearch);

  if (navInput) {
    navInput.addEventListener("input", () => {
      menuInput.value = navInput.value;
      runSearch();
    });
    navInput.addEventListener("keyup", () => {
      menuInput.value = navInput.value;
      runSearch();
    });
  }
}

syncMenuSearchInputs();

function applyMenuSearchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("search");
  if (!query) return;

  const menuInput = document.getElementById("menu-search-input");
  const navInput = document.getElementById("searchInput");
  if (menuInput) menuInput.value = query;
  if (navInput) navInput.value = query;
  searchFunction();
}

document.querySelectorAll(".btn-dark, .btn-gold").forEach((btn) => {
  if (btn.textContent.trim().toLowerCase() === "learn more") {
    btn.addEventListener("click", () => {
      window.location.href = "about.html";
    });
  }
});

function openCartSidebar() {
  if (!requireLogin("Please log in to view your cart.")) return;
  if (cartSidebar) cartSidebar.classList.add("open");
  if (cartOverlay) cartOverlay.classList.add("open");
}

function openFavoritesSidebar() {
  if (!requireLogin("Please log in to view your favorites.")) return;
  if (favSidebar) favSidebar.classList.add("open");
  if (cartOverlay) cartOverlay.classList.add("open");
}

document.querySelectorAll("[data-footer-action]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const action = link.dataset.footerAction;
    if (action === "open-login") openLoginModal();
    if (action === "open-cart") openCartSidebar();
    if (action === "open-favorites") openFavoritesSidebar();
  });
});

loadProductsCatalog().then(() => {
  applyMenuSearchFromUrl();
  updateFavUI();
});

if (isLoggedIn()) {
  loadOrders();
  prefillBookingForm();
}
