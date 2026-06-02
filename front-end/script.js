const API_BASE = "http://localhost:5000";

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
  alert(message || "Please log in or sign up first.");
  openLoginModal();
  return false;
}

function logoutUser(showMessage = true) {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("guestId");
  cartItems = [];
  favItems = [];
  updateCartUI();
  updateFavUI();
  updateAuthUI();
  if (showMessage) {
    alert("You have been logged out.");
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
  const num = parseFloat(value);
  if (Number.isNaN(num)) return String(value);
  return `$${num.toFixed(2)}`;
}

function getProductFromCard(card) {
  const img = card.querySelector("img");
  const titleEl = card.querySelector(".tittle, .title");
  const amountEl = card.querySelector(".amount");
  const name = titleEl ? titleEl.innerText.trim() : "Product";
  const priceText = amountEl ? amountEl.innerText.trim() : "$0";
  const price = parseFloat(priceText.replace("$", "")) || 0;
  const image = img ? img.getAttribute("src") : "";
  const id = card.dataset.productId || `${name}_${price}`.replace(/\s+/g, "_").toLowerCase();

  if (!card.dataset.productId) {
    card.dataset.productId = id;
  }

  return { id, name, price, priceText, image };
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
            <p>${item.price}${item.quantity > 1 ? ` x${item.quantity}` : ""}</p>
          </div>
          <button class="remove-item-btn" type="button"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    });
  }

  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace("$", ""));
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
}

async function removeCartItem(e) {
  const itemElement = e.target.closest(".cart-item");
  const itemId = itemElement.dataset.id;

  cartItems = cartItems.filter((item) => String(item.id) !== String(itemId));
  updateCartUI();

  if (!requireLogin("Please log in to manage your cart.")) return;

  try {
    const data = await apiRequest(`${API_BASE}/api/cart/remove`, {
      method: "POST",
      body: JSON.stringify({ id: itemId }),
    });
    syncCartFromServer(data);
  } catch (err) {
    alert(err.message || "Could not remove item.");
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
      openCart();
    } catch (err) {
      alert(err.message || "Could not add to cart. Is the server running?");
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
        alert("Your cart is empty.");
        return;
      }
      try {
        const data = await apiRequest(`${API_BASE}/api/cart/checkout`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        syncCartFromServer(data.cart);
        closeCart();
        alert(data.message || "Order placed!");
      } catch (err) {
        alert(err.message || "Checkout failed.");
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
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>${item.price}</p>
      </div>
      <button class="remove-fav-btn" type="button"><i class="fa-solid fa-trash"></i></button>
    </div>`
    )
    .join("");

  favItemsContainer.querySelectorAll(".remove-fav-btn").forEach((btn) => {
    btn.addEventListener("click", removeFavoriteItem);
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
    favItems = (data.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price || "",
      image: item.image || "",
    }));
    updateFavUI();
  } catch {
    /* ignore */
  }
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
        price: product.priceText,
        image: product.image,
      }),
    });
    favItems = data.items || [];
    updateFavUI();
  } catch (err) {
    alert(err.message || "Could not add to favorites.");
  }
}

async function removeFavoriteItem(e) {
  if (!requireLogin("Please log in to manage favorites.")) return;

  const itemEl = e.target.closest(".cart-item");
  const itemId = itemEl.dataset.id;

  try {
    const data = await apiRequest(`${API_BASE}/api/favorites/remove`, {
      method: "POST",
      body: JSON.stringify({ id: itemId }),
    });
    favItems = data.items || [];
    updateFavUI();
  } catch (err) {
    alert(err.message || "Could not remove favorite.");
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
  if (card) addToFavorites(card);
});

loadFavorites();

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
      alert("Please enter email and password.");
      return;
    }

    try {
      const data = await apiRequest(`${API_BASE}/api/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("loggedInUser", data.email);
      alert(`Welcome, ${data.name || data.email}!`);
      loginModal.classList.add("hidden");
      updateAuthUI();
      loadCart();
      loadFavorites();
    } catch (err) {
      alert(
        err.message ||
          "Login failed. Try admin@coffeeshop.com / admin123 or sign up first."
      );
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
      alert("Please fill in all sign-up fields.");
      return;
    }

    try {
      const data = await apiRequest(`${API_BASE}/api/signup`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert(data.message + " Login with your email and password.");
      box.querySelector('[data-tab="login"]').click();
    } catch (err) {
      alert(err.message || "Sign-up failed.");
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
      alert(data.message);
      signupForm.reset();
    } catch (err) {
      alert(err.message || "Sign-up failed. Please try again.");
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
        alert("Please enter your email.");
        return;
      }
      try {
        const data = await apiRequest(`${API_BASE}/api/newsletter`, {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        alert(data.message);
        emailInput.value = "";
      } catch (err) {
        alert(err.message || "Subscription failed.");
      }
    });
  }
}

/* ---------- Table booking ---------- */
const tableBookingForm = document.getElementById("table-booking-form");
if (tableBookingForm) {
  const dateInput = document.getElementById("booking-date");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }

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
      alert(data.message);
      tableBookingForm.reset();
      if (dateInput) {
        dateInput.min = new Date().toISOString().split("T")[0];
      }
    } catch (err) {
      alert(err.message || "Could not book table. Is the server running?");
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
      alert(data.message);
      contactForm.reset();
    } catch (err) {
      alert(err.message || "Could not send message.");
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
  if (!productList) return;

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
