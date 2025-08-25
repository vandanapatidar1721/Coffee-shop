const hamburger = document.querySelector(".hamburger");
const navList = document.querySelector(".navlist");

hamburger.addEventListener("click", () => {
  navList.classList.toggle("active");
});

  // --- Shopping Cart Logic ---
  const cartIcon = document.getElementById("cart-icon");
  const cartSidebar = document.getElementById("cart-sidebar");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartOverlay = document.getElementById("cart-overlay");
  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  const cartItemsContainer = document.getElementById("cart-items-container");
  const cartTotalPriceEl = document.getElementById("cart-total-price");
  const cartItemCountEl = document.getElementById("cart-item-count");
  const signUpButton = document.querySelector("#sign-up");
  console.log(signUpButton);
  
  let cartItems = [];

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
    openCart();
  });

  closeCartBtn.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  const addItemToCart = (e) => {
    const card = e.target.closest(".card");
    const itemImage = card.querySelector("img").src;
    const itemName = card.querySelector(".tittle, .title").innerText;
    const itemPrice = card.querySelector(".amount").innerText;

    const newItem = {
      id: Date.now(),
      name: itemName,
      price: itemPrice,
      image: itemImage,
    };

    cartItems.push(newItem);
    updateCart();
    openCart();
  };

  addToCartButtons.forEach(button => {
    button.addEventListener("click", addItemToCart);
  });

  const updateCart = () => {
    cartItemsContainer.innerHTML = "";

    if (cartItems.length === 0) {
      cartItemsContainer.innerHTML = '<p class="cart-empty-msg">Your cart is empty.</p>';
    } else {
      cartItems.forEach(item => {
        const cartItemHTML = `
          <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
              <h4>${item.name}</h4>
              <p>${item.price}</p>
            </div>
            <button class="remove-item-btn"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
        cartItemsContainer.innerHTML += cartItemHTML;
      });
    }

    const totalPrice = cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace('$', ''));
      return total + price;
    }, 0);

    cartTotalPriceEl.innerText = `${totalPrice.toFixed(2)}`;
    cartItemCountEl.innerText = cartItems.length;

    addRemoveEventListeners();
  };
  const addRemoveEventListeners = () => {
    const removeButtons = document.querySelectorAll(".remove-item-btn");
    removeButtons.forEach(button => {
      button.addEventListener("click", (e) => {
        const itemElement = e.target.closest('.cart-item');
        const itemId = Number(itemElement.dataset.id);
        cartItems = cartItems.filter(item => item.id !== itemId);
        updateCart();
      });
    });
  };
// Show/Hide the login modal
document.getElementById("menu-icon").addEventListener("click", () => {
  document.getElementById("login-modal").classList.toggle("hidden");
});

// Handle Sign-In button click
document.getElementById("sign-in-btn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "" || password === "") {
    alert("Please fill in both username and password.");
  } else {
    alert(`Welcome, ${username}! You are now signed in.`);
    
    // Optional: close the modal after signing in
    document.getElementById("login-modal").classList.add("hidden");

    // Optional: Save user info in localStorage (frontend only)
    localStorage.setItem("loggedInUser", username);
  }
});



const searchInput = document.getElementById("search-input");
const productCards = document.querySelectorAll("#product-list .card");

searchInput.addEventListener("keyup", function () {
  const query = searchInput.value.toLowerCase();

  productCards.forEach(card => {
    const keywords = card.getAttribute("data-name").toLowerCase();
    if (keywords.includes(query)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
});


// for lgin
// Show/hide login modal
const menuIcon = document.getElementById("menu-icon");
const loginModal = document.getElementById("login-modal");

menuIcon.addEventListener("click", () => {
    loginModal.classList.toggle("hidden");
});

// Handle Sign-in logic
const signInButton = loginModal.querySelector("button");

signInButton.addEventListener("click", () => {
    const username = loginModal.querySelector("input[type='text']").value.trim();
    const password = loginModal.querySelector("input[type='password']").value.trim();

    if (username === "" || password === "") {
        alert("Please fill in both fields.");
        return;
    }

    // Simulate sign-in success (replace with fetch() to backend if needed)
    alert(`Welcome, ${username}!`);
    loginModal.classList.add("hidden");

    // Optionally store user in localStorage
    localStorage.setItem("loggedInUser", username);
});
