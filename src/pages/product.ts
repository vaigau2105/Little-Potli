import { htmlHead, navBar, footer, cartDrawer, cartScript, SiteConfig, DEFAULT_SITE_CONFIG } from './layout'

export function productPage(config: SiteConfig = DEFAULT_SITE_CONFIG): string {
  return `${htmlHead('Product')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar('')}
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav class="mb-6 text-sm text-brand-maroon/60" id="breadcrumb">
      <a href="/" class="hover:text-brand-pink">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
      <a href="/shop" class="hover:text-brand-pink">Shop</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
      <span class="text-brand-maroon" id="breadcrumb-name">Loading...</span>
    </nav>

    <div id="product-loading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-brand-pink border-t-transparent"></div>
    </div>

    <div id="product-content" class="hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <!-- Images -->
        <div>
          <div class="bg-white rounded-2xl overflow-hidden border border-brand-pink-soft/50 shadow-sm mb-4">
            <img id="main-image" src="" alt="" class="w-full h-[400px] md:h-[500px] object-cover">
          </div>
          <div id="image-thumbnails" class="grid grid-cols-5 gap-2"></div>
        </div>

        <!-- Details -->
        <div class="space-y-6">
          <div>
            <p class="text-brand-gold text-xs tracking-[0.2em] uppercase mb-1" id="product-category"></p>
            <h1 class="font-serif text-3xl md:text-4xl font-bold text-brand-maroon" id="product-name"></h1>
          </div>
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-brand-pink" id="product-price"></span>
            <span class="text-lg text-brand-maroon/40 line-through hidden" id="product-compare-price"></span>
            <span class="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full hidden" id="product-discount"></span>
          </div>
          <p class="text-brand-maroon/70 leading-relaxed" id="product-description"></p>

          <div id="product-material" class="hidden">
            <h3 class="font-serif text-lg font-semibold text-brand-maroon mb-1">Material</h3>
            <p class="text-sm text-brand-maroon/60" id="material-text"></p>
          </div>

          <div id="product-care" class="hidden">
            <h3 class="font-serif text-lg font-semibold text-brand-maroon mb-1">Care Instructions</h3>
            <p class="text-sm text-brand-maroon/60" id="care-text"></p>
          </div>

          <div id="product-tags" class="flex flex-wrap gap-2 hidden"></div>

          <!-- Stock & Add to Cart -->
          <div class="border-t border-brand-pink-soft pt-6 space-y-4">
            <div class="flex items-center gap-2" id="stock-status"></div>
            <div class="flex items-center gap-4">
              <div class="flex items-center border border-brand-pink-light rounded-full overflow-hidden">
                <button onclick="updateQty(-1)" class="px-4 py-2 text-brand-maroon hover:bg-brand-pink-soft transition">-</button>
                <span id="qty" class="px-4 py-2 font-medium text-brand-maroon">1</span>
                <button onclick="updateQty(1)" class="px-4 py-2 text-brand-maroon hover:bg-brand-pink-soft transition">+</button>
              </div>
              <button onclick="addProductToCart()" id="add-to-cart-btn"
                class="flex-1 py-3 bg-brand-pink text-white rounded-full font-medium text-sm hover:bg-brand-pink-hover transition shadow-lg shadow-brand-pink/30">
                <i class="fas fa-shopping-bag mr-2"></i> Add to Cart
              </button>
            </div>
            <button onclick="addToWishlist()" class="w-full py-3 border-2 border-brand-gold text-brand-maroon rounded-full font-medium text-sm hover:bg-brand-gold hover:text-white transition">
              <i class="far fa-heart mr-2"></i> Add to Wishlist
            </button>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <section class="mt-16" id="reviews-section">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">Customer Reviews</h2>
        <div id="reviews-list" class="space-y-4"></div>
        <p id="no-reviews" class="text-brand-maroon/50 text-center py-8 hidden">No reviews yet. Be the first to review this product!</p>
      </section>

      <!-- Related Products -->
      <section class="mt-16" id="related-section" class="hidden">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">You May Also Like</h2>
        <div id="related-products" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
      </section>
    </div>

    <div id="product-error" class="hidden text-center py-20">
      <i class="fas fa-exclamation-circle text-5xl text-brand-pink/50 mb-4"></i>
      <h2 class="font-serif text-2xl text-brand-maroon mb-2">Product Not Found</h2>
      <p class="text-brand-maroon/60 mb-6">The product you are looking for doesn't exist or has been removed.</p>
      <a href="/shop" class="inline-flex items-center px-6 py-3 bg-brand-pink text-white rounded-full text-sm hover:bg-brand-pink-hover transition">
        <i class="fas fa-arrow-left mr-2"></i> Back to Shop
      </a>
    </div>
  </main>
  ${footer(config)}
  ${cartDrawer()}
  ${cartScript()}
  <script>
    let product = null;
    let quantity = 1;

    function updateQty(delta) {
      quantity = Math.max(1, Math.min(quantity + delta, product?.stock_quantity || 10));
      document.getElementById('qty').textContent = quantity;
    }

    function addProductToCart() {
      if (!product) return;
      const cart = JSON.parse(localStorage.getItem('littlepotli_cart') || '[]');
      const existing = cart.find(i => i.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image_url: product.images?.[0]?.image_url || '',
          quantity: quantity
        });
      }
      localStorage.setItem('littlepotli_cart', JSON.stringify(cart));
      updateCartCount();
      document.getElementById('cart-drawer')?.classList?.remove('translate-x-full');
      renderCartItems();
    }

    function addToWishlist() {
      if (!product) return;
      const wishlist = JSON.parse(localStorage.getItem('littlepotli_wishlist') || '[]');
      if (!wishlist.find(i => i.id === product.id)) {
        wishlist.push({ id: product.id, name: product.name, slug: product.slug, price: product.price, image_url: product.images?.[0]?.image_url || '' });
        localStorage.setItem('littlepotli_wishlist', JSON.stringify(wishlist));
      }
      alert('Added to wishlist!');
    }

    async function loadProduct() {
      const slug = window.location.pathname.split('/product/')[1];
      if (!slug) { showError(); return; }

      try {
        const res = await fetch('/api/products/' + slug);
        if (!res.ok) { showError(); return; }
        const data = await res.json();
        product = data.product;
        renderProduct();
      } catch (e) {
        showError();
      }
    }

    function showError() {
      document.getElementById('product-loading').classList.add('hidden');
      document.getElementById('product-error').classList.remove('hidden');
    }

    function renderProduct() {
      document.getElementById('product-loading').classList.add('hidden');
      document.getElementById('product-content').classList.remove('hidden');

      document.title = product.name + ' | Little Potli';
      document.getElementById('breadcrumb-name').textContent = product.name;
      document.getElementById('product-name').textContent = product.name;
      document.getElementById('product-category').textContent = product.category_name || '';
      document.getElementById('product-description').textContent = product.description || '';
      document.getElementById('product-price').textContent = '\\u20B9' + Number(product.price).toLocaleString('en-IN');

      if (product.compare_price && product.compare_price > product.price) {
        document.getElementById('product-compare-price').textContent = '\\u20B9' + Number(product.compare_price).toLocaleString('en-IN');
        document.getElementById('product-compare-price').classList.remove('hidden');
        const discount = Math.round((1 - product.price / product.compare_price) * 100);
        document.getElementById('product-discount').textContent = discount + '% OFF';
        document.getElementById('product-discount').classList.remove('hidden');
      }

      // Images
      const images = product.images || [];
      const mainImg = images.length > 0 ? images[0].image_url : 'https://placehold.co/600x600/FFE5EC/5C0624?text=No+Image';
      document.getElementById('main-image').src = mainImg;
      document.getElementById('main-image').alt = product.name;

      if (images.length > 1) {
        document.getElementById('image-thumbnails').innerHTML = images.map((img, i) =>
          '<button onclick="document.getElementById(\\'main-image\\').src=\\'' + img.image_url + '\\'" class="rounded-lg overflow-hidden border-2 ' + (i === 0 ? 'border-brand-pink' : 'border-transparent hover:border-brand-pink-light') + '"><img src="' + img.image_url + '" class="w-full h-16 object-cover" alt=""></button>'
        ).join('');
      }

      // Material & Care
      if (product.material) {
        document.getElementById('product-material').classList.remove('hidden');
        document.getElementById('material-text').textContent = product.material;
      }
      if (product.care_instructions) {
        document.getElementById('product-care').classList.remove('hidden');
        document.getElementById('care-text').textContent = product.care_instructions;
      }

      // Tags
      if (product.tags && product.tags.length > 0) {
        const tagsEl = document.getElementById('product-tags');
        tagsEl.classList.remove('hidden');
        tagsEl.innerHTML = product.tags.map(t => '<span class="px-3 py-1 bg-brand-pink-soft text-brand-maroon text-xs rounded-full">' + t + '</span>').join('');
      }

      // Stock status
      const stockEl = document.getElementById('stock-status');
      if (product.stock_quantity > 5) {
        stockEl.innerHTML = '<i class="fas fa-check-circle text-green-500"></i><span class="text-sm text-green-700">In Stock</span>';
      } else if (product.stock_quantity > 0) {
        stockEl.innerHTML = '<i class="fas fa-exclamation-circle text-orange-500"></i><span class="text-sm text-orange-700">Only ' + product.stock_quantity + ' left</span>';
      } else {
        stockEl.innerHTML = '<i class="fas fa-times-circle text-red-500"></i><span class="text-sm text-red-700">Out of Stock</span>';
        document.getElementById('add-to-cart-btn').disabled = true;
        document.getElementById('add-to-cart-btn').classList.add('opacity-50', 'cursor-not-allowed');
      }

      // Reviews
      if (product.reviews && product.reviews.length > 0) {
        document.getElementById('reviews-list').innerHTML = product.reviews.map(r =>
          '<div class="bg-white p-4 rounded-xl border border-brand-pink-soft/50"><div class="flex items-center gap-2 mb-2"><div class="text-brand-gold text-sm">' +
          '\\u2605'.repeat(r.rating) + '\\u2606'.repeat(5 - r.rating) +
          '</div><span class="text-xs text-brand-maroon/50">' + (r.user_name || 'Customer') + '</span></div>' +
          (r.comment ? '<p class="text-sm text-brand-maroon/70">' + r.comment + '</p>' : '') + '</div>'
        ).join('');
      } else {
        document.getElementById('no-reviews').classList.remove('hidden');
      }

      // Load related products
      loadRelated();
    }

    async function loadRelated() {
      try {
        const res = await fetch('/api/products?category=' + (product.category_slug || '') + '&limit=4');
        const data = await res.json();
        const related = (data.products || []).filter(p => p.id !== product.id).slice(0, 4);
        if (related.length > 0) {
          document.getElementById('related-products').innerHTML = related.map(p =>
            '<a href="/product/' + p.slug + '" class="bg-white rounded-xl overflow-hidden border border-brand-pink-soft/50 card-hover block">' +
            '<img src="' + (p.image_url || 'https://placehold.co/300x300/FFE5EC/5C0624?text=' + encodeURIComponent(p.name)) + '" class="w-full h-40 object-cover" alt="' + p.name + '">' +
            '<div class="p-3"><h4 class="font-serif text-sm font-semibold text-brand-maroon line-clamp-1">' + p.name + '</h4><p class="text-brand-pink font-bold text-sm mt-1">\\u20B9' + Number(p.price).toLocaleString('en-IN') + '</p></div></a>'
          ).join('');
        }
      } catch(e) {}
    }

    loadProduct();
  </script>
</body>
</html>`
}
