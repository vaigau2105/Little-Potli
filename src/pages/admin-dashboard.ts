import { htmlHead } from './layout'

export function adminDashboardPage(): string {
  return `${htmlHead('Admin Dashboard')}
<body class="bg-gray-50 min-h-screen">
  <!-- Top Bar -->
  <header class="bg-brand-maroon text-white shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
      <div class="flex items-center gap-3">
        <a href="/" class="text-brand-gold font-serif text-xl font-bold">Little Potli</a>
        <span class="text-white/40">|</span>
        <span class="text-sm text-white/70">Admin Panel</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-white/70" id="admin-name"></span>
        <button onclick="logout()" class="text-sm text-white/70 hover:text-white transition">
          <i class="fas fa-sign-out-alt mr-1"></i> Logout
        </button>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Navigation Tabs -->
    <div class="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
      <button onclick="showSection('overview')" class="tab-btn active px-4 py-2 rounded-full text-sm font-medium bg-brand-pink text-white" data-tab="overview">
        <i class="fas fa-chart-bar mr-1"></i> Overview
      </button>
      <button onclick="showSection('orders')" class="tab-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-brand-maroon border border-gray-200 hover:border-brand-pink" data-tab="orders">
        <i class="fas fa-shopping-bag mr-1"></i> Orders
      </button>
      <button onclick="showSection('products')" class="tab-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-brand-maroon border border-gray-200 hover:border-brand-pink" data-tab="products">
        <i class="fas fa-box mr-1"></i> Products
      </button>
      <button onclick="showSection('customers')" class="tab-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-brand-maroon border border-gray-200 hover:border-brand-pink" data-tab="customers">
        <i class="fas fa-users mr-1"></i> Customers
      </button>
      <button onclick="showSection('coupons')" class="tab-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-brand-maroon border border-gray-200 hover:border-brand-pink" data-tab="coupons">
        <i class="fas fa-ticket-alt mr-1"></i> Coupons
      </button>
    </div>

    <!-- Overview Section -->
    <section id="section-overview" class="section-content">
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-2"><i class="fas fa-shopping-bag text-brand-pink"></i><span class="text-xs text-green-600 font-medium" id="stat-orders-trend"></span></div>
          <p class="text-2xl font-bold text-brand-maroon" id="stat-orders">-</p>
          <p class="text-xs text-gray-500">Total Orders</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-2"><i class="fas fa-rupee-sign text-brand-gold"></i></div>
          <p class="text-2xl font-bold text-brand-maroon" id="stat-revenue">-</p>
          <p class="text-xs text-gray-500">Revenue</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-2"><i class="fas fa-box text-blue-500"></i></div>
          <p class="text-2xl font-bold text-brand-maroon" id="stat-products">-</p>
          <p class="text-xs text-gray-500">Products</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-2"><i class="fas fa-clock text-orange-500"></i></div>
          <p class="text-2xl font-bold text-brand-maroon" id="stat-pending">-</p>
          <p class="text-xs text-gray-500">Pending Orders</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-2"><i class="fas fa-exclamation-triangle text-red-500"></i></div>
          <p class="text-2xl font-bold text-brand-maroon" id="stat-lowstock">-</p>
          <p class="text-xs text-gray-500">Low Stock</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-2"><i class="fas fa-users text-green-500"></i></div>
          <p class="text-2xl font-bold text-brand-maroon" id="stat-customers">-</p>
          <p class="text-xs text-gray-500">Customers</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div class="p-4 border-b border-gray-100"><h3 class="font-semibold text-brand-maroon">Recent Orders</h3></div>
        <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="p-3 text-left text-gray-600 font-medium">Order #</th><th class="p-3 text-left text-gray-600 font-medium">Customer</th><th class="p-3 text-left text-gray-600 font-medium">Total</th><th class="p-3 text-left text-gray-600 font-medium">Status</th><th class="p-3 text-left text-gray-600 font-medium">Date</th></tr></thead><tbody id="recent-orders-tbody"></tbody></table></div>
      </div>
    </section>

    <!-- Orders Section -->
    <section id="section-orders" class="section-content hidden">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-brand-maroon">All Orders</h2>
        <select id="order-status-filter" onchange="loadOrders()" class="px-3 py-2 rounded-lg border border-gray-200 text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="p-3 text-left text-gray-600 font-medium">Order #</th><th class="p-3 text-left text-gray-600 font-medium">Customer</th><th class="p-3 text-left text-gray-600 font-medium">Total</th><th class="p-3 text-left text-gray-600 font-medium">Payment</th><th class="p-3 text-left text-gray-600 font-medium">Status</th><th class="p-3 text-left text-gray-600 font-medium">Date</th><th class="p-3 text-left text-gray-600 font-medium">Actions</th></tr></thead><tbody id="orders-tbody"></tbody></table>
      </div>
    </section>

    <!-- Products Section -->
    <section id="section-products" class="section-content hidden">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-brand-maroon">All Products</h2>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="p-3 text-left text-gray-600 font-medium">Product</th><th class="p-3 text-left text-gray-600 font-medium">Category</th><th class="p-3 text-left text-gray-600 font-medium">Price</th><th class="p-3 text-left text-gray-600 font-medium">Stock</th><th class="p-3 text-left text-gray-600 font-medium">Status</th></tr></thead><tbody id="products-tbody"></tbody></table>
      </div>
    </section>

    <!-- Customers Section -->
    <section id="section-customers" class="section-content hidden">
      <h2 class="text-lg font-semibold text-brand-maroon mb-4">Customers</h2>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="p-3 text-left text-gray-600 font-medium">Name</th><th class="p-3 text-left text-gray-600 font-medium">Email</th><th class="p-3 text-left text-gray-600 font-medium">Orders</th><th class="p-3 text-left text-gray-600 font-medium">Spent</th><th class="p-3 text-left text-gray-600 font-medium">Joined</th></tr></thead><tbody id="customers-tbody"></tbody></table>
      </div>
    </section>

    <!-- Coupons Section -->
    <section id="section-coupons" class="section-content hidden">
      <h2 class="text-lg font-semibold text-brand-maroon mb-4">Coupons</h2>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="p-3 text-left text-gray-600 font-medium">Code</th><th class="p-3 text-left text-gray-600 font-medium">Type</th><th class="p-3 text-left text-gray-600 font-medium">Value</th><th class="p-3 text-left text-gray-600 font-medium">Usage</th><th class="p-3 text-left text-gray-600 font-medium">Valid Until</th><th class="p-3 text-left text-gray-600 font-medium">Status</th></tr></thead><tbody id="coupons-tbody"></tbody></table>
      </div>
    </section>
  </div>

  <script>
    const token = localStorage.getItem('littlepotli_admin_token');
    const user = JSON.parse(localStorage.getItem('littlepotli_admin_user') || 'null');
    if (!token || !user) { window.location.href = '/admin/login'; }
    document.getElementById('admin-name').textContent = user?.name || 'Admin';

    const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    function logout() {
      localStorage.removeItem('littlepotli_admin_token');
      localStorage.removeItem('littlepotli_admin_user');
      window.location.href = '/admin/login';
    }

    function showSection(name) {
      document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
      document.getElementById('section-' + name).classList.remove('hidden');
      document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === name) {
          btn.className = 'tab-btn active px-4 py-2 rounded-full text-sm font-medium bg-brand-pink text-white';
        } else {
          btn.className = 'tab-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-brand-maroon border border-gray-200 hover:border-brand-pink';
        }
      });
      if (name === 'orders') loadOrders();
      if (name === 'products') loadProducts();
      if (name === 'customers') loadCustomers();
      if (name === 'coupons') loadCoupons();
    }

    function statusBadge(status) {
      const colors = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-purple-100 text-purple-700', shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', paid: 'bg-green-100 text-green-700' };
      return '<span class="px-2 py-1 rounded-full text-xs font-medium ' + (colors[status] || 'bg-gray-100 text-gray-700') + '">' + (status || 'N/A') + '</span>';
    }

    async function loadDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard', { headers });
        if (res.status === 401) { logout(); return; }
        const data = await res.json();
        document.getElementById('stat-orders').textContent = data.stats.totalOrders;
        document.getElementById('stat-revenue').textContent = '\\u20B9' + Number(data.stats.totalRevenue).toLocaleString('en-IN');
        document.getElementById('stat-products').textContent = data.stats.totalProducts;
        document.getElementById('stat-pending').textContent = data.stats.pendingOrders;
        document.getElementById('stat-lowstock').textContent = data.stats.lowStock;
        document.getElementById('stat-customers').textContent = data.stats.totalCustomers;

        document.getElementById('recent-orders-tbody').innerHTML = (data.recentOrders || []).map(o =>
          '<tr class="border-b border-gray-50"><td class="p-3 font-medium text-brand-pink">' + o.order_number + '</td><td class="p-3">' + (o.customer_name || 'Guest') + '</td><td class="p-3 font-medium">\\u20B9' + Number(o.total_amount).toLocaleString('en-IN') + '</td><td class="p-3">' + statusBadge(o.status) + '</td><td class="p-3 text-gray-500">' + new Date(o.created_at).toLocaleDateString('en-IN') + '</td></tr>'
        ).join('') || '<tr><td colspan="5" class="p-4 text-center text-gray-400">No orders yet.</td></tr>';
      } catch(e) { console.error('Dashboard load failed:', e); }
    }

    async function loadOrders() {
      try {
        const status = document.getElementById('order-status-filter').value;
        const res = await fetch('/api/admin/orders' + (status ? '?status=' + status : ''), { headers });
        const data = await res.json();
        document.getElementById('orders-tbody').innerHTML = (data.orders || []).map(o =>
          '<tr class="border-b border-gray-50"><td class="p-3 font-medium text-brand-pink">' + o.order_number + '</td><td class="p-3">' + (o.customer_name || 'Guest') + '</td><td class="p-3 font-medium">\\u20B9' + Number(o.total_amount).toLocaleString('en-IN') + '</td><td class="p-3">' + statusBadge(o.payment_status) + '</td><td class="p-3">' + statusBadge(o.status) + '</td><td class="p-3 text-gray-500 text-xs">' + new Date(o.created_at).toLocaleDateString('en-IN') + '</td><td class="p-3"><select onchange="updateOrderStatus(' + o.id + ', this.value)" class="text-xs border rounded px-2 py-1"><option value="">Update...</option><option value="confirmed">Confirm</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancel</option></select></td></tr>'
        ).join('') || '<tr><td colspan="7" class="p-4 text-center text-gray-400">No orders found.</td></tr>';
      } catch(e) {}
    }

    async function updateOrderStatus(id, status) {
      if (!status) return;
      try {
        await fetch('/api/admin/orders/' + id + '/status', { method: 'PUT', headers, body: JSON.stringify({ status }) });
        loadOrders();
        loadDashboard();
      } catch(e) { alert('Failed to update order status'); }
    }

    async function loadProducts() {
      try {
        const res = await fetch('/api/admin/products', { headers });
        const data = await res.json();
        document.getElementById('products-tbody').innerHTML = (data.products || []).map(p =>
          '<tr class="border-b border-gray-50"><td class="p-3"><div class="flex items-center gap-3">' +
          (p.image_url ? '<img src="' + p.image_url + '" class="w-10 h-10 rounded-lg object-cover">' : '<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><i class="fas fa-image text-gray-300"></i></div>') +
          '<span class="font-medium text-brand-maroon">' + p.name + '</span></div></td><td class="p-3 text-gray-600">' + (p.category_name || '-') + '</td><td class="p-3 font-medium">\\u20B9' + Number(p.price).toLocaleString('en-IN') + '</td><td class="p-3 ' + (p.stock_quantity <= (p.low_stock_threshold || 5) ? 'text-red-600 font-medium' : 'text-gray-600') + '">' + p.stock_quantity + '</td><td class="p-3">' + (p.is_active ? '<span class="text-green-600 text-xs font-medium">Active</span>' : '<span class="text-red-600 text-xs font-medium">Inactive</span>') + '</td></tr>'
        ).join('') || '<tr><td colspan="5" class="p-4 text-center text-gray-400">No products.</td></tr>';
      } catch(e) {}
    }

    async function loadCustomers() {
      try {
        const res = await fetch('/api/admin/customers', { headers });
        const data = await res.json();
        document.getElementById('customers-tbody').innerHTML = (data.customers || []).map(c =>
          '<tr class="border-b border-gray-50"><td class="p-3 font-medium text-brand-maroon">' + c.name + '</td><td class="p-3 text-gray-600">' + c.email + '</td><td class="p-3">' + (c.order_count || 0) + '</td><td class="p-3 font-medium">\\u20B9' + Number(c.total_spent || 0).toLocaleString('en-IN') + '</td><td class="p-3 text-gray-500 text-xs">' + new Date(c.created_at).toLocaleDateString('en-IN') + '</td></tr>'
        ).join('') || '<tr><td colspan="5" class="p-4 text-center text-gray-400">No customers yet.</td></tr>';
      } catch(e) {}
    }

    async function loadCoupons() {
      try {
        const res = await fetch('/api/admin/coupons', { headers });
        const data = await res.json();
        document.getElementById('coupons-tbody').innerHTML = (data.coupons || []).map(c =>
          '<tr class="border-b border-gray-50"><td class="p-3 font-mono font-medium text-brand-pink">' + c.code + '</td><td class="p-3 capitalize">' + c.discount_type + '</td><td class="p-3 font-medium">' + (c.discount_type === 'percentage' ? c.discount_value + '%' : '\\u20B9' + c.discount_value) + '</td><td class="p-3">' + c.used_count + (c.usage_limit ? '/' + c.usage_limit : '') + '</td><td class="p-3 text-xs text-gray-500">' + (c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : 'No expiry') + '</td><td class="p-3">' + (c.is_active ? '<span class="text-green-600 text-xs font-medium">Active</span>' : '<span class="text-red-600 text-xs font-medium">Inactive</span>') + '</td></tr>'
        ).join('') || '<tr><td colspan="6" class="p-4 text-center text-gray-400">No coupons.</td></tr>';
      } catch(e) {}
    }

    loadDashboard();
  </script>
</body>
</html>`
}
