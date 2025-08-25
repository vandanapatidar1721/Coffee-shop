

// // backend
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            console.log("hello");
            
            // Prevent the default form submission (which reloads the page)
            event.preventDefault();

            // Get form data
            const name = document.getElementById('name').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const phoneNumber = document.getElementById('phoneNumber').value;

            // Prepare the data to be sent to the server
            const formData = {
                name,
                lastName,
                email,
                phoneNumber
            };

            try {
                // Send the data to your backend API endpoint using fetch
                const response = await fetch('http://localhost:3001/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                // Get the response from the server as JSON
                const result = await response.json();

                if (response.ok) {
                    // Success!
                    alert('Success! ' + result.message);
                    signupForm.reset(); // Clear the form fields
                } else {
                    // Error from the server (e.g., missing fields, user exists)
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                // Network error or server is down
                console.error('Submission failed:', error);
                alert('Sign-up failed. Please try again later.');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = {
                name: signupForm.name.value,
                lastName: signupForm.lastName.value,
                email: signupForm.email.value,
                phoneNumber: signupForm.phoneNumber.value
            };

            fetch('https://localhost:3001/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                alert('Signup successful!');
                // Optionally reset the form
                signupForm.reset();
            })
            .catch(error => {
                alert('Signup failed!');
                console.error('Error:', error);
            });
        });
    }
});


document.addEventListener('DOMContentLoaded', function () {
    // Example product data (replace with actual product info as needed)
    const product = {
        id: '123', // Replace with actual product id
        name: 'Coffee', // Replace with actual product name
        price: 10 // Replace with actual product price
    };

    const addToCartBtn = document.querySelector('.add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function () {
            fetch('http://localhost:3000/add', { // Use your actual backend URL/port
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            })
            .then(response => response.json())
            .then(data => {
                alert('Added to cart!');
                // Optionally update cart UI here
            })
            .catch(error => {
                alert('Failed to add to cart.');
                console.error(error);
            });
        });
    }
});

// for add to car back-end
document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.getElementById('cart-icon');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const cartItemCountEl = document.getElementById('cart-item-count');

    const API_URL = 'http://localhost:3001'; // Your backend server URL

    // --- Cart Visibility ---
    const showCart = () => cartSidebar.classList.add('open');
    const hideCart = () => cartSidebar.classList.remove('open');

    cartIcon.addEventListener('click', showCart);
    closeCartBtn.addEventListener('click', hideCart);
    cartOverlay.addEventListener('click', hideCart);

    // --- Core Cart Logic ---

    // Function to update the entire cart display
    const updateCartDisplay = (cart) => {
        // Clear previous items
        cartItemsContainer.innerHTML = '';

        if (cart.items.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.items.forEach(item => {
                const cartItemEl = document.createElement('div');
                cartItemEl.classList.add('cart-item');
                cartItemEl.innerHTML = `
                    <p class="item-name">${item.name} (x${item.quantity})</p>
                    <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button class="remove-item-btn" data-product-id="${item.id}">&times;</button>
                `;
                cartItemsContainer.appendChild(cartItemEl);
            });
        }
        
        // Update total price
        cartTotalPriceEl.textContent = cart.total.toFixed(2);
        
        // Update the item count bubble
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cartItemCountEl.textContent = totalItems;

        // Add event listeners to the new "remove" buttons
        addRemoveListeners();
    };
    
    // Function to handle adding an item
    const handleAddToCart = async (event) => {
        const button = event.target;
        const card = button.closest('.card');
        
        const id = card.dataset.productId;
        const name = card.querySelector('.tittle').textContent.trim();
        // Extract number from price string like "$100.00"
        const priceString = card.querySelector('.amount').textContent;
        const price = parseFloat(priceString.replace(/[^0-9.-]+/g,""));
        
        try {
            const response = await fetch(`${API_URL}/api/cart/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, price })
            });
            const updatedCart = await response.json();
            updateCartDisplay(updatedCart);
            showCart(); // Show cart after adding an item
        } catch (error) {
            console.error('Failed to add item:', error);
            alert('Could not add item to cart. Please try again.');
        }
    };
    
    // Function to handle removing an item
    const handleRemoveFromCart = async (event) => {
        const button = event.target;
        const id = button.dataset.productId;
        
        try {
            const response = await fetch(`${API_URL}/api/cart/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const updatedCart = await response.json();
            updateCartDisplay(updatedCart);
        } catch (error) {
            console.error('Failed to remove item:', error);
            alert('Could not remove item from cart. Please try again.');
        }
    };

    // Attach listeners to "add-to-cart" buttons
    addToCartButtons.forEach(button => {
        button.addEventListener('click', handleAddToCart);
    });

    // Function to attach listeners to dynamically created "remove" buttons
    const addRemoveListeners = () => {
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            // Remove old listener to prevent duplicates
            button.removeEventListener('click', handleRemoveFromCart); 
            // Add new listener
            button.addEventListener('click', handleRemoveFromCart);
        });
    };
    
    // Load initial cart state when the page loads
    const initializeCart = async () => {
        try {
            const response = await fetch(`${API_URL}/api/cart`);
            const cart = await response.json();
            updateCartDisplay(cart);
        } catch (error) {
            console.error('Failed to initialize cart:', error);
        }
    };

    initializeCart();
});


// for sign-up
// script.js (frontend)

// ... existing code ...

const loginModal = document.getElementById('login-modal');
const menuIcon = document.getElementById('menu-icon'); // The user icon that triggers the login modal

// Select the sign-in specific elements
const signInButton = document.getElementById('signInBtn');
const signinUsernameInput = document.getElementById('signinUsername');
const signinPasswordInput = document.getElementById('signinPassword');

if (menuIcon) {
    menuIcon.addEventListener('click', () => {
        loginModal.classList.toggle('hidden');
    });
}

// Function to handle Sign-In
if (signInButton) {
    signInButton.addEventListener('click', async () => {
        const username = signinUsernameInput.value;
        const password = signinPasswordInput.value;

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch('/api/signin', { // Target the new sign-in route
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // "Signed in successfully!"
                // Store the token (e.g., in localStorage)
                localStorage.setItem('jwtToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user)); // Store user info if needed

                loginModal.classList.add('hidden'); // Hide the modal
                // Update UI to show logged-in state (e.g., change user icon, show "Welcome, [username]")
                console.log('User signed in:', data.user.username);
                // You might want to reload the page or redirect
                // window.location.reload();

            } else {
                alert(`Sign-in failed: ${data.message}`); // Display error message from backend
            }
        } catch (error) {
            console.error('Error during sign-in fetch:', error);
            alert('An unexpected error occurred during sign-in. Please try again.');
        }
    });
}


// for sign in
fetch('http://localhost:3001/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        alert(`Welcome, ${username}`);
        loginModal.classList.add("hidden");
    } else {
        alert("Invalid credentials!");
    }
})
.catch(err => {
    console.error("Sign-in error:", err);
});

