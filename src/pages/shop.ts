import { htmlHead, navBar, cartDrawer, cartScript } from './layout'

export function shopPage(): string {
  return `${htmlHead('Shop')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar('shop')}
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav class="mb-6 text-sm text-brand-maroon/60"><a href="/" class="hover:text-brand-pink">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i> <span class="text-brand-maroon">Shop</span></nav>
    <div class="flex flex-col lg:flex-row gap-8">
      <aside class="lg:w-64 flex-shrink-0">
        <div class="bg-white rounded-2xl p-6 border border-brand-pink-soft/50 shadow-sm sticky top-24">
          <h3 class="font-serif text-xl font-bold text-brand-maroon mb-4">Filters</h3>
          <div class="mb-6"><h4 class="font-medium text-brand-maroon text-sm mb-3">Category</h4><div id="filter-categories" class="space-y-2"></div></div>
          <div class="mb-6"><h4 class="font-medium text-brand-maroon text-sm mb-3">Price Range</h4>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="price" value="" onchange="applyFilters()" checked class="accent-brand-pink"> All</label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="price" value="0-999" onchange="applyFilters()" class="accent-brand-pink"> Under \\u20B9999</label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="price" value="1000-2499" onchange="applyFilters()" class="accent-brand-pink"> \\u20B91,000 - \\u20B92,499</label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="price" value="2500-4999" onchange="applyFilters()" class="accent-brand-pink"> \\u20B92,500 - \\u20B94,999</label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="price" value="5000-" onchange="applyFilters()" class="accent-brand-pink"> Above \\u20B95,000</label>
            </div>
          </div>
          <div><h4 class="font-medium text-brand-maroon text-sm mb-3">Sort By</h4>
            <select id="sort-select" onchange="applyFilters()" class="w-full p-2 rounded-lg border border-brand-pink-light text-sm text-brand-maroon focus:border-brand-pink outline-none">
              <option value="newest">Newest First</option><option value="popular">Popularity</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </aside>
      <div class="flex-1">
        <div class="flex items-center justify-between mb-6"><h1 class="font-serif text-3xl font-bold text-brand-maroon" id="shop-title">All Products</h1><p class="text-sm text-brand-maroon/60" id="product-count"></p></div>
        <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      </div>
    </div>
  </main>
  ${cartDrawer()}
  ${cartScript()}
  <script>
    let currentCategory = new URLSearchParams(window.location.search).get('category') || '';
    let currentSearch = new URLSearchParams(window.location.search).get('search') || '';

    function productCard(p) {
      const isWished = wishlist.includes(p.id);
      return '<div class="card-hover bg-white rounded-2xl overflow-hidden border border-brand-pink-soft/50 shadow-sm"><div class="relative group"><a href="/product/'+p.slug+'"><img src="'+(p.image_url||'')+'" alt="'+p.name+'" class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"></a><button onclick="toggleWishlist('+p.id+')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md '+(isWished?'text-brand-pink':'text-brand-maroon/40')+'"><i class="fas fa-heart text-sm"></i></button>'+(p.is_new_arrival?'<span class="absolute top-3 left-3 bg-brand-gold text-white text-xs px-2 py-1 rounded-full">New</span>':'')+'</div><div class="p-4"><p class="text-xs text-brand-gold uppercase tracking-wider mb-1">'+(p.category_name||'')+'</p><a href="/product/'+p.slug+'"><h3 class="font-serif text-lg font-semibold text-brand-maroon hover:text-brand-pink transition-colors mb-2">'+p.name+'</h3></a><div class="flex items-center justify-between"><div><span class="text-brand-pink font-bold">\\u20B9'+p.price.toLocaleString('en-IN')+'</span>'+(p.compare_price?'<span class="text-brand-maroon/40 text-sm line-through ml-2">\\u20B9'+p.compare_price.toLocaleString('en-IN')+'</span>':'')+'</div><button onclick="addToCart({id:'+p.id+',name:\\''+p.name.replace(/'/g,"\\\\'")+'\\'  ,price:'+p.price+',image:\\''+(p.image_url||'')+'\\'  ,slug:\\''+p.slug+'\\'  })" class="w-9 h-9 rounded-full bg-brand-pink-soft text-brand-pink flex items-center justify-center hover:bg-brand-pink hover:text-white transition-all"><i class="fas fa-plus text-sm"></i></button></div></div></div>';
    }

    async function loadProducts() {
      const sort = document.getElementById('sort-select').value;
      const priceVal = document.querySelector('input[name="price"]:checked')?.value || '';
      let url = '/api/products?sort='+sort+'&limit=20';
      if (currentCategory) url += '&category='+currentCategory;
      if (currentSearch) url += '&search='+currentSearch;
      if (priceVal) { const [min,max] = priceVal.split('-'); if(min) url+='&min_price='+min; if(max) url+='&max_price='+max; }
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById('products-grid').innerHTML = data.products.length ? data.products.map(p => productCard(p)).join('') : '<p class="col-span-3 text-center text-brand-maroon/50 py-12">No products found</p>';
      document.getElementById('product-count').textContent = data.total + ' products';
      if (currentCategory) document.getElementById('shop-title').textContent = currentCategory.replace(/-/g,' ').replace(/\\b\\w/g,l=>l.toUpperCase());
      if (currentSearch) document.getElementById('shop-title').textContent = 'Search: "'+currentSearch+'"';
    }

    async function loadFilters() {
      const res = await fetch('/api/categories');
      const data = await res.json();
      document.getElementById('filter-categories').innerHTML = '<label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="category" value="" onchange="currentCategory=\\'\\';applyFilters()" '+(currentCategory?'':'checked')+' class="accent-brand-pink"> All</label>' + data.categories.map(cat => '<label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="category" value="'+cat.slug+'" onchange="currentCategory=\\''+cat.slug+'\\';applyFilters()" '+(currentCategory===cat.slug?'checked':'')+' class="accent-brand-pink"> '+cat.name+'</label>').join('');
    }

    function applyFilters() { loadProducts(); }
    loadFilters(); loadProducts();
  </script>
</body>
</html>`
}
