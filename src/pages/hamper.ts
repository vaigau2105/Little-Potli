import { htmlHead, navBar, footer, cartDrawer, cartScript } from './layout'

export function hamperPage(): string {
  return `${htmlHead('Build Your Hamper')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar('hamper')}
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav class="mb-6 text-sm text-brand-maroon/60">
      <a href="/" class="hover:text-brand-pink">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
      <span class="text-brand-maroon">Build Your Hamper</span>
    </nav>

    <div class="text-center mb-10">
      <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Custom Gifting</p>
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-brand-maroon mb-3">Build Your Perfect Hamper</h1>
      <p class="text-brand-maroon/60 max-w-2xl mx-auto">Choose a box, pick your products, select beautiful packaging - and create a personalized gift that tells your story.</p>
    </div>

    <!-- Steps -->
    <div class="flex justify-center mb-10">
      <div class="flex items-center gap-2 text-sm">
        <span class="step-indicator active flex items-center gap-2 px-4 py-2 rounded-full bg-brand-pink text-white font-medium" id="step-1-indicator">
          <span class="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs">1</span> Choose Box
        </span>
        <i class="fas fa-chevron-right text-brand-maroon/30 mx-1"></i>
        <span class="step-indicator flex items-center gap-2 px-4 py-2 rounded-full bg-white text-brand-maroon/50 border border-brand-pink-light font-medium" id="step-2-indicator">
          <span class="w-5 h-5 rounded-full bg-brand-pink-soft flex items-center justify-center text-xs">2</span> Add Products
        </span>
        <i class="fas fa-chevron-right text-brand-maroon/30 mx-1"></i>
        <span class="step-indicator flex items-center gap-2 px-4 py-2 rounded-full bg-white text-brand-maroon/50 border border-brand-pink-light font-medium" id="step-3-indicator">
          <span class="w-5 h-5 rounded-full bg-brand-pink-soft flex items-center justify-center text-xs">3</span> Packaging
        </span>
      </div>
    </div>

    <!-- Step 1: Choose Box -->
    <section id="step-1" class="fade-in">
      <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">Select Your Hamper Box</h2>
      <div id="boxes-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="flex justify-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-4 border-brand-pink border-t-transparent"></div></div>
      </div>
    </section>

    <!-- Step 2: Add Products -->
    <section id="step-2" class="hidden fade-in">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon">Add Products to Your Hamper</h2>
        <span class="text-sm text-brand-maroon/60">Selected: <strong id="selected-count">0</strong> / <strong id="max-items">6</strong></span>
      </div>
      <div id="hamper-products-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
      <div class="mt-6 flex justify-between">
        <button onclick="goToStep(1)" class="px-6 py-2 border-2 border-brand-maroon/20 text-brand-maroon rounded-full text-sm hover:border-brand-pink hover:text-brand-pink transition"><i class="fas fa-arrow-left mr-2"></i>Back</button>
        <button onclick="goToStep(3)" id="step2-next" class="px-6 py-2 bg-brand-pink text-white rounded-full text-sm hover:bg-brand-pink-hover transition disabled:opacity-50 disabled:cursor-not-allowed" disabled>Next: Packaging <i class="fas fa-arrow-right ml-2"></i></button>
      </div>
    </section>

    <!-- Step 3: Packaging -->
    <section id="step-3" class="hidden fade-in">
      <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">Choose Packaging Style</h2>
      <div id="packaging-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      <div class="mt-8 bg-white rounded-2xl p-6 border border-brand-pink-soft/50 shadow-sm">
        <h3 class="font-serif text-xl font-bold text-brand-maroon mb-4">Your Hamper Summary</h3>
        <div id="hamper-summary"></div>
        <div class="border-t border-brand-pink-soft mt-4 pt-4 flex justify-between items-center">
          <span class="font-serif text-lg text-brand-maroon">Total:</span>
          <span class="text-2xl font-bold text-brand-pink" id="hamper-total">\u20B90</span>
        </div>
        <div class="mt-4 flex gap-3">
          <button onclick="goToStep(2)" class="px-6 py-2 border-2 border-brand-maroon/20 text-brand-maroon rounded-full text-sm hover:border-brand-pink hover:text-brand-pink transition"><i class="fas fa-arrow-left mr-2"></i>Back</button>
          <button onclick="addHamperToCart()" class="flex-1 py-3 bg-brand-pink text-white rounded-full font-medium text-sm hover:bg-brand-pink-hover transition shadow-lg shadow-brand-pink/30">
            <i class="fas fa-shopping-bag mr-2"></i> Add Hamper to Cart
          </button>
        </div>
      </div>
    </section>
  </main>
  ${footer()}
  ${cartDrawer()}
  ${cartScript()}
  <script>
    let hamperState = { box: null, products: [], packaging: null };
    let allProducts = [];
    let boxes = [];
    let materials = [];

    async function init() {
      const [boxRes, prodRes, matRes] = await Promise.all([
        fetch('/api/hamper-boxes'), fetch('/api/products?limit=50'), fetch('/api/packaging-materials')
      ]);
      const boxData = await boxRes.json();
      const prodData = await prodRes.json();
      const matData = await matRes.json();
      boxes = boxData.boxes || [];
      allProducts = prodData.products || [];
      materials = matData.materials || [];
      renderBoxes();
    }

    function renderBoxes() {
      document.getElementById('boxes-grid').innerHTML = boxes.map(box =>
        '<div class="bg-white rounded-2xl p-6 border border-brand-pink-soft/50 card-hover cursor-pointer hover:border-brand-pink" onclick="selectBox(' + box.id + ')">' +
        (box.image_url ? '<img src="' + box.image_url + '" class="w-full h-40 object-cover rounded-xl mb-4" alt="' + box.name + '">' : '<div class="w-full h-40 bg-brand-pink-soft rounded-xl mb-4 flex items-center justify-center"><i class="fas fa-box-open text-4xl text-brand-pink/50"></i></div>') +
        '<h3 class="font-serif text-lg font-bold text-brand-maroon">' + box.name + '</h3>' +
        '<p class="text-sm text-brand-maroon/60 mt-1">' + (box.description || 'Fits up to ' + box.max_items + ' items') + '</p>' +
        '<div class="mt-3 flex justify-between items-center"><span class="text-brand-pink font-bold">\\u20B9' + Number(box.price).toLocaleString('en-IN') + '</span><span class="text-xs text-brand-maroon/40">Up to ' + box.max_items + ' items</span></div></div>'
      ).join('') || '<p class="text-center text-brand-maroon/50 col-span-3 py-10">No hamper boxes available at the moment.</p>';
    }

    function selectBox(id) {
      hamperState.box = boxes.find(b => b.id === id);
      hamperState.products = [];
      document.getElementById('max-items').textContent = hamperState.box.max_items;
      renderProducts();
      goToStep(2);
    }

    function renderProducts() {
      document.getElementById('hamper-products-grid').innerHTML = allProducts.map(p => {
        const selected = hamperState.products.find(s => s.id === p.id);
        return '<div class="bg-white rounded-xl overflow-hidden border ' + (selected ? 'border-brand-pink ring-2 ring-brand-pink/30' : 'border-brand-pink-soft/50') + ' card-hover">' +
        '<img src="' + (p.image_url || 'https://placehold.co/300x300/FFE5EC/5C0624?text=' + encodeURIComponent(p.name)) + '" class="w-full h-32 object-cover" alt="' + p.name + '">' +
        '<div class="p-3"><h4 class="font-serif text-sm font-semibold text-brand-maroon line-clamp-1">' + p.name + '</h4>' +
        '<p class="text-brand-pink font-bold text-sm mt-1">\\u20B9' + Number(p.price).toLocaleString('en-IN') + '</p>' +
        '<button onclick="toggleProduct(' + p.id + ')" class="mt-2 w-full py-1.5 rounded-full text-xs font-medium transition ' +
        (selected ? 'bg-brand-pink text-white' : 'bg-brand-pink-soft text-brand-pink hover:bg-brand-pink hover:text-white') + '">' +
        (selected ? '<i class="fas fa-check mr-1"></i>Added' : '<i class="fas fa-plus mr-1"></i>Add') + '</button></div></div>';
      }).join('');
      updateSelectedCount();
    }

    function toggleProduct(id) {
      const idx = hamperState.products.findIndex(p => p.id === id);
      if (idx > -1) {
        hamperState.products.splice(idx, 1);
      } else {
        if (hamperState.products.length >= hamperState.box.max_items) {
          alert('Maximum ' + hamperState.box.max_items + ' items allowed in this box.');
          return;
        }
        const prod = allProducts.find(p => p.id === id);
        if (prod) hamperState.products.push(prod);
      }
      renderProducts();
    }

    function updateSelectedCount() {
      document.getElementById('selected-count').textContent = hamperState.products.length;
      document.getElementById('step2-next').disabled = hamperState.products.length === 0;
    }

    function goToStep(step) {
      [1, 2, 3].forEach(s => {
        document.getElementById('step-' + s).classList.toggle('hidden', s !== step);
        const ind = document.getElementById('step-' + s + '-indicator');
        if (s === step) { ind.className = 'step-indicator flex items-center gap-2 px-4 py-2 rounded-full bg-brand-pink text-white font-medium'; }
        else if (s < step) { ind.className = 'step-indicator flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium'; }
        else { ind.className = 'step-indicator flex items-center gap-2 px-4 py-2 rounded-full bg-white text-brand-maroon/50 border border-brand-pink-light font-medium'; }
      });
      if (step === 3) renderPackaging();
    }

    function renderPackaging() {
      document.getElementById('packaging-grid').innerHTML = materials.map(m => {
        const selected = hamperState.packaging?.id === m.id;
        return '<div class="bg-white rounded-2xl p-5 border ' + (selected ? 'border-brand-pink ring-2 ring-brand-pink/30' : 'border-brand-pink-soft/50') + ' card-hover cursor-pointer" onclick="selectPackaging(' + m.id + ')">' +
        (m.image_url ? '<img src="' + m.image_url + '" class="w-full h-32 object-cover rounded-xl mb-3" alt="' + m.name + '">' : '<div class="w-full h-32 bg-brand-pink-soft rounded-xl mb-3 flex items-center justify-center"><i class="fas fa-ribbon text-3xl text-brand-pink/50"></i></div>') +
        '<h3 class="font-serif text-base font-bold text-brand-maroon">' + m.name + '</h3>' +
        '<p class="text-xs text-brand-maroon/60 mt-1">' + (m.description || m.material_type) + '</p>' +
        '<p class="text-brand-pink font-bold text-sm mt-2">\\u20B9' + Number(m.price).toLocaleString('en-IN') + '</p></div>';
      }).join('') || '<p class="text-center text-brand-maroon/50 col-span-3">No packaging options available.</p>';
      renderSummary();
    }

    function selectPackaging(id) {
      hamperState.packaging = materials.find(m => m.id === id);
      renderPackaging();
    }

    function renderSummary() {
      let total = hamperState.box ? hamperState.box.price : 0;
      let html = '<div class="space-y-2 text-sm">';
      html += '<div class="flex justify-between"><span class="text-brand-maroon/70">Box: ' + (hamperState.box?.name || '') + '</span><span class="font-medium">\\u20B9' + Number(hamperState.box?.price || 0).toLocaleString('en-IN') + '</span></div>';
      hamperState.products.forEach(p => {
        total += p.price;
        html += '<div class="flex justify-between"><span class="text-brand-maroon/70 line-clamp-1">' + p.name + '</span><span class="font-medium">\\u20B9' + Number(p.price).toLocaleString('en-IN') + '</span></div>';
      });
      if (hamperState.packaging) {
        total += hamperState.packaging.price;
        html += '<div class="flex justify-between"><span class="text-brand-maroon/70">Packaging: ' + hamperState.packaging.name + '</span><span class="font-medium">\\u20B9' + Number(hamperState.packaging.price).toLocaleString('en-IN') + '</span></div>';
      }
      html += '</div>';
      document.getElementById('hamper-summary').innerHTML = html;
      document.getElementById('hamper-total').textContent = '\\u20B9' + total.toLocaleString('en-IN');
    }

    function addHamperToCart() {
      if (!hamperState.box || hamperState.products.length === 0) {
        alert('Please select a box and add at least one product.');
        return;
      }
      let total = hamperState.box.price;
      hamperState.products.forEach(p => total += p.price);
      if (hamperState.packaging) total += hamperState.packaging.price;

      const cart = JSON.parse(localStorage.getItem('littlepotli_cart') || '[]');
      cart.push({
        id: 'hamper-' + Date.now(),
        name: 'Custom Hamper (' + hamperState.box.name + ')',
        price: total,
        image_url: hamperState.box.image_url || '',
        quantity: 1,
        is_hamper: true,
        hamper_details: {
          box: hamperState.box.name,
          products: hamperState.products.map(p => p.name),
          packaging: hamperState.packaging?.name || 'Standard'
        }
      });
      localStorage.setItem('littlepotli_cart', JSON.stringify(cart));
      updateCartCount();
      document.getElementById('cart-drawer')?.classList?.remove('translate-x-full');
      renderCartItems();
    }

    init();
  </script>
</body>
</html>`
}
