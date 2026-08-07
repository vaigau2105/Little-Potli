import { htmlHead, navBar, footer, cartDrawer, cartScript } from './layout'

export function collectionsPage(): string {
  return `${htmlHead('Collections')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar('collections')}
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav class="mb-6 text-sm text-brand-maroon/60">
      <a href="/" class="hover:text-brand-pink">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
      <span class="text-brand-maroon">Collections</span>
    </nav>

    <div class="text-center mb-12">
      <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Explore</p>
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-brand-maroon mb-3">Our Collections</h1>
      <p class="text-brand-maroon/60 max-w-2xl mx-auto">Browse our thoughtfully curated collections of gifts, accessories, and hampers for every occasion.</p>
    </div>

    <div id="collections-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="flex justify-center py-10 col-span-full"><div class="animate-spin rounded-full h-10 w-10 border-4 border-brand-pink border-t-transparent"></div></div>
    </div>

    <!-- Featured Collection Banner -->
    <section class="mt-16 bg-white rounded-3xl overflow-hidden border border-brand-pink-soft/50 shadow-sm">
      <div class="grid md:grid-cols-2">
        <div class="p-8 md:p-12 flex flex-col justify-center">
          <p class="text-brand-gold text-xs tracking-[0.2em] uppercase mb-2">Featured</p>
          <h2 class="font-serif text-3xl font-bold text-brand-maroon mb-4">New Arrivals</h2>
          <p class="text-brand-maroon/60 mb-6">Discover our latest additions - fresh picks that are perfect for the season.</p>
          <a href="/shop?new_arrivals=1" class="inline-flex items-center px-6 py-3 bg-brand-pink text-white rounded-full text-sm font-medium hover:bg-brand-pink-hover transition w-fit shadow-lg shadow-brand-pink/20">
            <i class="fas fa-sparkles mr-2"></i> Shop New Arrivals
          </a>
        </div>
        <div class="brand-gradient p-8 flex items-center justify-center">
          <div class="grid grid-cols-2 gap-3" id="new-arrivals-preview"></div>
        </div>
      </div>
    </section>

    <!-- Best Sellers -->
    <section class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon">Best Sellers</h2>
        <a href="/shop?best_sellers=1" class="text-sm text-brand-pink hover:text-brand-pink-hover font-medium">View All <i class="fas fa-arrow-right ml-1"></i></a>
      </div>
      <div id="best-sellers-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
    </section>
  </main>
  ${footer()}
  ${cartDrawer()}
  ${cartScript()}
  <script>
    async function loadCollections() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        const categories = data.categories || [];

        document.getElementById('collections-grid').innerHTML = categories.map(cat =>
          '<a href="/shop?category=' + cat.slug + '" class="group block bg-white rounded-2xl overflow-hidden border border-brand-pink-soft/50 card-hover">' +
          '<div class="h-48 overflow-hidden">' +
          (cat.image_url ? '<img src="' + cat.image_url + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="' + cat.name + '">' :
          '<div class="w-full h-full brand-gradient flex items-center justify-center"><i class="fas fa-gem text-5xl text-brand-pink/30"></i></div>') +
          '</div><div class="p-6"><h3 class="font-serif text-xl font-bold text-brand-maroon group-hover:text-brand-pink transition">' + cat.name + '</h3>' +
          (cat.description ? '<p class="text-sm text-brand-maroon/60 mt-2 line-clamp-2">' + cat.description + '</p>' : '') +
          '<p class="text-brand-pink text-sm font-medium mt-3">Shop Now <i class="fas fa-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i></p></div></a>'
        ).join('') || '<p class="text-center text-brand-maroon/50 col-span-3 py-10">No collections available.</p>';
      } catch(e) {
        document.getElementById('collections-grid').innerHTML = '<p class="text-center text-brand-maroon/50 col-span-3">Failed to load collections.</p>';
      }
    }

    async function loadBestSellers() {
      try {
        const res = await fetch('/api/products?best_sellers=1&limit=4');
        const data = await res.json();
        const products = data.products || [];

        document.getElementById('best-sellers-grid').innerHTML = products.map(p =>
          '<a href="/product/' + p.slug + '" class="bg-white rounded-xl overflow-hidden border border-brand-pink-soft/50 card-hover block">' +
          '<img src="' + (p.image_url || 'https://placehold.co/300x300/FFE5EC/5C0624?text=' + encodeURIComponent(p.name)) + '" class="w-full h-40 object-cover" alt="' + p.name + '">' +
          '<div class="p-3"><h4 class="font-serif text-sm font-semibold text-brand-maroon line-clamp-1">' + p.name + '</h4>' +
          '<p class="text-brand-pink font-bold text-sm mt-1">\\u20B9' + Number(p.price).toLocaleString('en-IN') + '</p></div></a>'
        ).join('') || '<p class="text-brand-maroon/50 col-span-4 text-center py-6">No best sellers yet.</p>';

        // New arrivals preview
        const newRes = await fetch('/api/products?new_arrivals=1&limit=4');
        const newData = await newRes.json();
        const newProds = newData.products || [];
        document.getElementById('new-arrivals-preview').innerHTML = newProds.slice(0, 4).map(p =>
          '<div class="bg-white rounded-lg overflow-hidden shadow-sm"><img src="' + (p.image_url || 'https://placehold.co/150x150/FFE5EC/5C0624?text=New') + '" class="w-full h-24 object-cover" alt="' + p.name + '"></div>'
        ).join('');
      } catch(e) {}
    }

    loadCollections();
    loadBestSellers();
  </script>
</body>
</html>`
}
