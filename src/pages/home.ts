import { htmlHead, navBar, footer, cartDrawer, cartScript, SiteConfig, DEFAULT_SITE_CONFIG } from './layout'

export function homePage(config: SiteConfig = DEFAULT_SITE_CONFIG): string {
  return `${htmlHead('Home')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar('home')}

  <!-- Hero Section -->
  <section class="brand-gradient relative overflow-hidden">
    <div class="absolute inset-0 opacity-5">
      <div class="absolute top-10 left-10 w-20 h-20 border border-brand-gold rounded-full"></div>
      <div class="absolute bottom-20 right-20 w-32 h-32 border border-brand-pink rounded-full"></div>
    </div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div class="text-center max-w-3xl mx-auto fade-in">
        <p class="text-brand-gold font-sans text-sm tracking-[0.3em] uppercase mb-4">Welcome to Little Potli</p>
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-brand-maroon mb-6 leading-tight">
          Curated Gifts,<br><span class="text-brand-pink">Crafted with Love</span>
        </h1>
        <p class="text-brand-maroon/70 text-base md:text-lg mb-8 font-light leading-relaxed">
          Discover handpicked accessories and build your perfect gift hamper. From elegant earrings to bespoke hampers, every piece tells a story of love and celebration.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/shop" class="inline-flex items-center justify-center px-8 py-3 bg-brand-pink text-white rounded-full font-medium text-sm tracking-wide hover:bg-brand-pink-hover transition-all shadow-lg shadow-brand-pink/30">
            <i class="fas fa-gem mr-2"></i> Explore Collection
          </a>
          <a href="/build-hamper" class="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-gold text-brand-maroon rounded-full font-medium text-sm tracking-wide hover:bg-brand-gold hover:text-white transition-all">
            <i class="fas fa-gift mr-2"></i> Build Your Hamper
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Categories -->
  <section class="py-16 md:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Browse By</p>
        <h2 class="text-3xl md:text-4xl font-serif font-bold text-brand-maroon">Our Collections</h2>
      </div>
      <div id="categories-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"></div>
    </div>
  </section>

  <!-- Featured Products -->
  <section class="py-16 md:py-20 brand-gradient">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Handpicked for You</p>
        <h2 class="text-3xl md:text-4xl font-serif font-bold text-brand-maroon">Featured Pieces</h2>
      </div>
      <div id="featured-products" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
      <div class="text-center mt-10">
        <a href="/shop" class="inline-flex items-center px-8 py-3 border-2 border-brand-maroon text-brand-maroon rounded-full font-medium text-sm hover:bg-brand-maroon hover:text-white transition-all">View All Products <i class="fas fa-arrow-right ml-2"></i></a>
      </div>
    </div>
  </section>

  <!-- Hamper CTA -->
  <section class="py-16 md:py-20 bg-white relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div class="bg-gradient-to-r from-brand-maroon to-brand-pink rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl">
        <h2 class="text-3xl md:text-5xl font-serif font-bold mb-4">Build Your Dream Hamper</h2>
        <p class="text-white/80 text-base md:text-lg mb-8 max-w-2xl mx-auto font-light">Choose your box, pick accessories, add a personal touch, and create a gift from the heart.</p>
        <a href="/build-hamper" class="inline-flex items-center px-10 py-4 bg-white text-brand-pink rounded-full font-semibold text-sm hover:bg-brand-ivory transition-all shadow-lg"><i class="fas fa-magic mr-2"></i> Start Building</a>
      </div>
    </div>
  </section>

  <!-- Best Sellers -->
  <section class="py-16 md:py-20 bg-brand-cream">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Most Loved</p>
        <h2 class="text-3xl md:text-4xl font-serif font-bold text-brand-maroon">Best Sellers</h2>
      </div>
      <div id="best-sellers" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
    </div>
  </section>

  <!-- Why Choose Us -->
  <section class="py-16 md:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12"><h2 class="text-3xl md:text-4xl font-serif font-bold text-brand-maroon">Why Little Potli?</h2></div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="text-center"><div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center"><i class="fas fa-hand-holding-heart text-brand-pink text-2xl"></i></div><h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Handcrafted</h3><p class="text-sm text-brand-maroon/60 font-light">Every piece made with love and attention to detail</p></div>
        <div class="text-center"><div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center"><i class="fas fa-gift text-brand-pink text-2xl"></i></div><h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Custom Hampers</h3><p class="text-sm text-brand-maroon/60 font-light">Build personalized gift hampers for any occasion</p></div>
        <div class="text-center"><div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center"><i class="fas fa-shipping-fast text-brand-pink text-2xl"></i></div><h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Pan-India Delivery</h3><p class="text-sm text-brand-maroon/60 font-light">Free shipping on orders above \\u20B91,999</p></div>
        <div class="text-center"><div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center"><i class="fas fa-ribbon text-brand-pink text-2xl"></i></div><h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Premium Packaging</h3><p class="text-sm text-brand-maroon/60 font-light">Luxurious packaging that makes every gift special</p></div>
      </div>
    </div>
  </section>

  ${footer(config)}
  ${cartDrawer()}
  ${cartScript()}
  <script>
    function productCard(p) {
      const isWished = wishlist.includes(p.id);
      return '<div class="card-hover bg-white rounded-2xl overflow-hidden border border-brand-pink-soft/50 shadow-sm">' +
        '<div class="relative group"><a href="/product/' + p.slug + '"><img src="' + (p.image_url || '') + '" alt="' + p.name + '" class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"></a>' +
        '<button onclick="toggleWishlist(' + p.id + ');this.classList.toggle(\\\'text-brand-pink\\\')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md ' + (isWished ? 'text-brand-pink' : 'text-brand-maroon/40') + '"><i class="fas fa-heart text-sm"></i></button>' +
        (p.is_new_arrival ? '<span class="absolute top-3 left-3 bg-brand-gold text-white text-xs px-2 py-1 rounded-full font-medium">New</span>' : '') +
        (p.compare_price ? '<span class="absolute bottom-3 left-3 bg-brand-pink text-white text-xs px-2 py-1 rounded-full font-medium">' + Math.round((1 - p.price/p.compare_price)*100) + '% OFF</span>' : '') +
        '</div><div class="p-4"><p class="text-xs text-brand-gold uppercase tracking-wider mb-1">' + (p.category_name || '') + '</p>' +
        '<a href="/product/' + p.slug + '"><h3 class="font-serif text-lg font-semibold text-brand-maroon hover:text-brand-pink transition-colors mb-2">' + p.name + '</h3></a>' +
        '<div class="flex items-center justify-between"><div><span class="text-brand-pink font-bold">\\u20B9' + p.price.toLocaleString('en-IN') + '</span>' +
        (p.compare_price ? '<span class="text-brand-maroon/40 text-sm line-through ml-2">\\u20B9' + p.compare_price.toLocaleString('en-IN') + '</span>' : '') +
        '</div><button onclick="addToCart({id:' + p.id + ',name:\\'' + p.name.replace(/'/g, "\\\\'") + '\\',price:' + p.price + ',image:\\'' + (p.image_url || '') + '\\',slug:\\'' + p.slug + '\\'})\" class="w-9 h-9 rounded-full bg-brand-pink-soft text-brand-pink flex items-center justify-center hover:bg-brand-pink hover:text-white transition-all"><i class="fas fa-plus text-sm"></i></button></div></div></div>';
    }

    async function loadHomepage() {
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        const catIcons = ['fa-gem','fa-ring','fa-crown','fa-necklace','fa-gift','fa-heart','fa-building','fa-star'];
        const catColors = ['from-pink-100 to-rose-50','from-amber-50 to-yellow-50','from-purple-50 to-pink-50','from-blue-50 to-indigo-50','from-rose-50 to-pink-50','from-red-50 to-rose-50','from-slate-50 to-gray-50','from-orange-50 to-amber-50'];
        document.getElementById('categories-grid').innerHTML = catData.categories.slice(0,8).map((cat,i) =>
          '<a href="/shop?category=' + cat.slug + '" class="card-hover block bg-gradient-to-br ' + (catColors[i]||catColors[0]) + ' rounded-2xl p-6 text-center border border-brand-pink-soft/30">' +
          '<div class="w-12 h-12 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-sm"><i class="fas ' + (catIcons[i]||'fa-gem') + ' text-brand-pink text-lg"></i></div>' +
          '<h3 class="font-serif text-lg font-semibold text-brand-maroon">' + cat.name + '</h3></a>'
        ).join('');

        const featRes = await fetch('/api/products?featured=1&limit=4');
        const featData = await featRes.json();
        document.getElementById('featured-products').innerHTML = featData.products.map(p => productCard(p)).join('');

        const bestRes = await fetch('/api/products?best_sellers=1&limit=4');
        const bestData = await bestRes.json();
        document.getElementById('best-sellers').innerHTML = bestData.products.map(p => productCard(p)).join('');
      } catch(err) { console.error('Error loading homepage:', err); }
    }
    loadHomepage();
  </script>
</body>
</html>`
}
