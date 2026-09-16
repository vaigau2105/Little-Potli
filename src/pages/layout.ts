// Site configuration passed from route handlers (sourced from env vars)
export type SiteConfig = {
  storeEmail: string
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  storeEmail: 'potli.little@gmail.com'
}

// Shared HTML head with brand styling
export const htmlHead = (title: string, extraHead = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Little Potli</title>
  <meta name="description" content="Little Potli - Curated Gifts, Crafted with Love. Discover handpicked accessories and build your perfect gift hamper.">
  <meta property="og:title" content="${title} | Little Potli">
  <meta property="og:description" content="Curated Gifts, Crafted with Love">
  <meta property="og:image" content="/static/Logo.png">
  <link rel="icon" href="/static/favicon.ico" type="image/png">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              pink: '#F169A7',
              'pink-light': '#FFC4D6',
              'pink-soft': '#FFE5EC',
              'pink-hover': '#C80058',
              maroon: '#5C0624',
              ivory: '#FFFAF5',
              gold: '#C9A96E',
              'gold-light': '#E8D5B0',
              cream: '#FFF8F0',
            }
          },
          fontFamily: {
            serif: ['Cormorant Garamond', 'Georgia', 'serif'],
            sans: ['Montserrat', 'system-ui', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    * { scroll-behavior: smooth; }
    body { font-family: 'Montserrat', sans-serif; }
    h1, h2, h3, h4, h5 { font-family: 'Cormorant Garamond', serif; }
    .brand-gradient { background: linear-gradient(135deg, #FFE5EC 0%, #FFFAF5 50%, #FFF8F0 100%); }
    .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(92, 6, 36, 0.1); }
    .fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .nav-link { position: relative; }
    .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: #E5006D; transition: width 0.3s; }
    .nav-link:hover::after { width: 100%; }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #FFF8F0; }
    ::-webkit-scrollbar-thumb { background: #FFC4D6; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #E5006D; }
  </style>
  ${extraHead}
</head>`

export const navBar = (active = '') => `
<nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-pink-soft shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16 md:h-20">
      <a href="/" class="flex items-center gap-3">
        <img src="/static/Logo.png" alt="Little Potli" class="h-12 md:h-14 w-auto">
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="/" class="nav-link ${active === 'home' ? 'text-brand-pink' : 'text-brand-maroon'} font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Home</a>
        <a href="/shop" class="nav-link ${active === 'shop' ? 'text-brand-pink' : 'text-brand-maroon'} font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Shop</a>
        <a href="/collections" class="nav-link ${active === 'collections' ? 'text-brand-pink' : 'text-brand-maroon'} font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Collections</a>
        <a href="/build-hamper" class="nav-link ${active === 'hamper' ? 'text-brand-pink' : 'text-brand-maroon'} font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Build Hamper</a>
        <a href="/about" class="nav-link ${active === 'about' ? 'text-brand-pink' : 'text-brand-maroon'} font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">About</a>
      </div>
      <div class="flex items-center gap-4">
        <button onclick="toggleSearch()" class="text-brand-maroon hover:text-brand-pink transition-colors"><i class="fas fa-search text-lg"></i></button>
        <a href="/wishlist" class="text-brand-maroon hover:text-brand-pink transition-colors relative">
          <i class="fas fa-heart text-lg"></i>
          <span id="wishlist-count" class="absolute -top-2 -right-2 bg-brand-pink text-white text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
        </a>
        <button onclick="toggleCart()" class="text-brand-maroon hover:text-brand-pink transition-colors relative">
          <i class="fas fa-shopping-bag text-lg"></i>
          <span id="cart-count" class="absolute -top-2 -right-2 bg-brand-pink text-white text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
        </button>
        <button class="md:hidden text-brand-maroon" onclick="toggleMobileMenu()"><i class="fas fa-bars text-xl"></i></button>
        <!-- Customer Login / Account Icon -->
        <a href="/login" class="text-brand-maroon hover:text-brand-pink transition-colors relative" title="Account / Login">
          <i class="fas fa-user text-lg"></i>
        </a>  
      </div>
    </div>
  </div>
  <div id="search-bar" class="hidden border-t border-brand-pink-soft bg-white px-4 py-3">
    <div class="max-w-2xl mx-auto relative">
      <input type="text" id="search-input" placeholder="Search for earrings, bracelets, gift sets..." class="w-full pl-10 pr-4 py-2 rounded-full border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm">
      <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-brand-pink-light"></i>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden border-t border-brand-pink-soft bg-white">
    <div class="px-4 py-4 space-y-3">
      <a href="/" class="block text-brand-maroon font-medium py-2">Home</a>
      <a href="/shop" class="block text-brand-maroon font-medium py-2">Shop</a>
      <a href="/collections" class="block text-brand-maroon font-medium py-2">Collections</a>
      <a href="/build-hamper" class="block text-brand-maroon font-medium py-2">Build Hamper</a>
      <a href="/about" class="block text-brand-maroon font-medium py-2">About</a>
      <a href="/login" class="block text-brand-maroon font-medium py-2"><i class="fas fa-user-circle mr-2"></i>Login / Account</a>
    </div>
  </div>
</nav>`

export const footer = (config: SiteConfig = DEFAULT_SITE_CONFIG) => `
<footer class="bg-brand-maroon text-white pt-16 pb-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
      <div>
        <img src="https://www.genspark.ai/api/files/s/xpWlRGhD" alt="Little Potli" class="h-16 mb-4 brightness-0 invert">
        <p class="text-white/70 text-sm font-light leading-relaxed">Curated Gifts, Crafted with Love. Making every celebration memorable.</p>
      </div>
      <div>
        <h4 class="font-serif text-lg font-semibold mb-4">Quick Links</h4>
        <ul class="space-y-2 text-sm text-white/70">
          <li><a href="/shop" class="hover:text-brand-pink-light transition-colors">Shop All</a></li>
          <li><a href="/build-hamper" class="hover:text-brand-pink-light transition-colors">Build Hamper</a></li>
          <li><a href="/collections" class="hover:text-brand-pink-light transition-colors">Collections</a></li>
          <li><a href="/about" class="hover:text-brand-pink-light transition-colors">About Us</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-serif text-lg font-semibold mb-4">Customer Care</h4>
        <ul class="space-y-2 text-sm text-white/70">
          <li><a href="/about" class="hover:text-brand-pink-light transition-colors">Contact Us</a></li>
          <li><a href="#" class="hover:text-brand-pink-light transition-colors">Shipping Policy</a></li>
          <li><a href="#" class="hover:text-brand-pink-light transition-colors">Returns & Exchanges</a></li>
          <li><a href="#" class="hover:text-brand-pink-light transition-colors">FAQs</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-serif text-lg font-semibold mb-4">Get in Touch</h4>
        <ul class="space-y-2 text-sm text-white/70">
          <li><a href="mailto:${config.storeEmail}" class="hover:text-brand-pink-light transition-colors"><i class="fas fa-envelope mr-2 text-brand-pink-light"></i> ${config.storeEmail}</a></li>
          <li><i class="fas fa-phone mr-2 text-brand-pink-light"></i> +91 90349 10627</li>
          <li class="pt-2"><a href="https://wa.me/919034910627" class="inline-flex items-center text-brand-pink-light hover:text-white transition-colors"><i class="fab fa-whatsapp mr-2 text-lg"></i> Chat on WhatsApp</a></li>
        </ul>
        <div class="flex gap-4 mt-4">
          <a href="#" class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-pink transition-colors"><i class="fab fa-instagram"></i></a>
          <a href="#" class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-pink transition-colors"><i class="fab fa-facebook-f"></i></a>
          <a href="#" class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-pink transition-colors"><i class="fab fa-pinterest-p"></i></a>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 pt-8 text-center text-sm text-white/50">
      <p>&copy; 2024 Little Potli. All rights reserved. Made with <i class="fas fa-heart text-brand-pink"></i> in India</p>
    </div>
  </div>
</footer>`

export const cartDrawer = () => `
<div id="cart-drawer" class="fixed inset-0 z-[100] hidden">
  <div class="absolute inset-0 bg-black/50" onclick="toggleCart()"></div>
  <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform">
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between p-6 border-b border-brand-pink-soft">
        <h3 class="font-serif text-2xl font-bold text-brand-maroon">Your Bag</h3>
        <button onclick="toggleCart()" class="text-brand-maroon hover:text-brand-pink"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div id="cart-items" class="flex-1 overflow-y-auto p-6">
        <p class="text-center text-brand-maroon/50 py-12">Your bag is empty</p>
      </div>
      <div class="border-t border-brand-pink-soft p-6">
        <div class="flex justify-between mb-4">
          <span class="font-medium text-brand-maroon">Subtotal</span>
          <span id="cart-total" class="font-semibold text-brand-maroon">₹0</span>
        </div>
        <a href="/checkout" class="block w-full py-3 bg-brand-pink text-white rounded-full font-medium hover:bg-brand-pink-hover transition-colors text-center">
          Proceed to Checkout
        </a>
      </div>
    </div>
  </div>
</div>`

export const cartScript = () => `
<script>
  let cart = JSON.parse(localStorage.getItem('lp_cart') || '[]');
  let wishlist = JSON.parse(localStorage.getItem('lp_wishlist') || '[]');

  function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) {
      if (count > 0) { countEl.textContent = count; countEl.classList.remove('hidden'); }
      else { countEl.classList.add('hidden'); }
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = '\\u20B9' + total.toLocaleString('en-IN');
    
    const itemsEl = document.getElementById('cart-items');
    if (!itemsEl) return;
    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="text-center text-brand-maroon/50 py-12">Your bag is empty</p>';
    } else {
      itemsEl.innerHTML = cart.map((item, i) => 
        '<div class="flex gap-4 mb-4 pb-4 border-b border-brand-pink-soft">' +
        '<img src="' + (item.image || '') + '" alt="' + item.name + '" class="w-16 h-16 object-cover rounded-lg">' +
        '<div class="flex-1"><h4 class="text-sm font-medium text-brand-maroon">' + item.name + '</h4>' +
        '<p class="text-brand-pink font-semibold text-sm">\\u20B9' + item.price.toLocaleString('en-IN') + '</p>' +
        '<div class="flex items-center gap-2 mt-1">' +
        '<button onclick="updateQty(' + i + ', -1)" class="w-6 h-6 rounded-full bg-brand-pink-soft text-brand-maroon text-xs flex items-center justify-center">-</button>' +
        '<span class="text-xs">' + item.quantity + '</span>' +
        '<button onclick="updateQty(' + i + ', 1)" class="w-6 h-6 rounded-full bg-brand-pink-soft text-brand-maroon text-xs flex items-center justify-center">+</button>' +
        '<button onclick="removeFromCart(' + i + ')" class="ml-auto text-red-400 text-xs"><i class="fas fa-trash"></i></button>' +
        '</div></div></div>'
      ).join('');
    }
  }

  function addToCart(product) {
    const existing = cart.findIndex(item => item.id === product.id);
    if (existing >= 0) { cart[existing].quantity++; }
    else { cart.push({ ...product, quantity: 1 }); }
    localStorage.setItem('lp_cart', JSON.stringify(cart));
    updateCartUI();
    toggleCart();
  }

  function updateQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('lp_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('lp_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function toggleCart() { document.getElementById('cart-drawer')?.classList.toggle('hidden'); }
  function toggleSearch() { document.getElementById('search-bar')?.classList.toggle('hidden'); document.getElementById('search-input')?.focus(); }
  function toggleMobileMenu() { document.getElementById('mobile-menu')?.classList.toggle('hidden'); }

  function toggleWishlist(productId) {
    const idx = wishlist.indexOf(productId);
    if (idx >= 0) wishlist.splice(idx, 1);
    else wishlist.push(productId);
    localStorage.setItem('lp_wishlist', JSON.stringify(wishlist));
    const countEl = document.getElementById('wishlist-count');
    if (countEl) {
      if (wishlist.length > 0) { countEl.textContent = wishlist.length; countEl.classList.remove('hidden'); }
      else { countEl.classList.add('hidden'); }
    }
  }

  // Search
  document.getElementById('search-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') window.location.href = '/shop?search=' + e.target.value;
  });

  updateCartUI();
</script>`
