import { htmlHead, navBar, footer, SiteConfig, DEFAULT_SITE_CONFIG } from './layout'

export function orderConfirmationPage(config: SiteConfig = DEFAULT_SITE_CONFIG): string {
  return `${htmlHead('Order Confirmed')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar()}

  <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div id="loading" class="text-center py-20">
      <div class="animate-spin w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-brand-maroon/60">Loading order details...</p>
    </div>

    <div id="confirmation" class="hidden fade-in">
      <div class="text-center mb-10">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-check text-green-500 text-3xl"></i>
        </div>
        <h1 class="font-serif text-4xl font-bold text-brand-maroon mb-2">Thank You!</h1>
        <p class="text-brand-maroon/70 text-lg">Your order has been placed successfully.</p>
      </div>

      <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6 md:p-8 mb-6">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-brand-pink-soft">
          <div>
            <p class="text-sm text-brand-maroon/60">Order Number</p>
            <p class="font-serif text-2xl font-bold text-brand-pink" id="conf-order-number">-</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-brand-maroon/60">Status</p>
            <span id="conf-status" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
              <i class="fas fa-check-circle"></i> <span id="conf-status-text">Confirmed</span>
            </span>
          </div>
        </div>

        <h3 class="font-serif text-lg font-bold text-brand-maroon mb-3">Items Ordered</h3>
        <div id="conf-items" class="space-y-3 mb-6"></div>

        <div class="border-t border-brand-pink-soft pt-4 space-y-2 text-sm">
          <div class="flex justify-between text-brand-maroon/70"><span>Subtotal</span><span id="conf-subtotal">-</span></div>
          <div class="flex justify-between text-brand-maroon/70"><span>Shipping</span><span id="conf-shipping">-</span></div>
          <div id="conf-discount-row" class="flex justify-between text-green-600 hidden"><span>Discount</span><span id="conf-discount">-</span></div>
          <div class="border-t border-brand-pink-soft pt-3 flex justify-between font-bold text-brand-maroon text-lg">
            <span>Total Paid</span><span id="conf-total">-</span>
          </div>
        </div>
      </div>

      <div id="conf-address-section" class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6 mb-6">
        <h3 class="font-serif text-lg font-bold text-brand-maroon mb-3"><i class="fas fa-truck mr-2 text-brand-pink"></i>Delivery Address</h3>
        <div id="conf-address" class="text-sm text-brand-maroon/70"></div>
      </div>

      <div id="conf-gift-section" class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6 mb-6 hidden">
        <h3 class="font-serif text-lg font-bold text-brand-maroon mb-3"><i class="fas fa-gift mr-2 text-brand-pink"></i>Gift Message</h3>
        <p id="conf-gift-message" class="text-sm text-brand-maroon/70 italic"></p>
      </div>

      <div class="text-center space-y-3">
        <p class="text-sm text-brand-maroon/60">A confirmation email has been sent to your email address.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/shop" class="px-6 py-3 bg-brand-pink text-white rounded-full font-medium hover:bg-brand-pink-hover transition-colors text-sm">
            <i class="fas fa-shopping-bag mr-2"></i> Continue Shopping
          </a>
          <a href="https://wa.me/919034910627" target="_blank" class="px-6 py-3 border-2 border-brand-gold text-brand-maroon rounded-full font-medium hover:bg-brand-gold hover:text-white transition-colors text-sm">
            <i class="fab fa-whatsapp mr-2"></i> Track on WhatsApp
          </a>
        </div>
      </div>
    </div>

    <div id="not-found" class="hidden text-center py-20">
      <i class="fas fa-exclamation-circle text-5xl text-brand-pink-light mb-4"></i>
      <h2 class="font-serif text-2xl text-brand-maroon mb-2">Order Not Found</h2>
      <p class="text-brand-maroon/60 mb-6">We couldn't find this order. Please check the order number.</p>
      <a href="/" class="px-6 py-3 bg-brand-pink text-white rounded-full font-medium">Go Home</a>
    </div>
  </main>

  ${footer(config)}

  <script>
    async function loadOrder() {
      const params = new URLSearchParams(window.location.search);
      const orderNumber = params.get('order');
      if (!orderNumber) { showNotFound(); return; }

      try {
        const res = await fetch('/api/orders/' + orderNumber);
        if (!res.ok) { showNotFound(); return; }
        const { order } = await res.json();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('confirmation').classList.remove('hidden');

        document.getElementById('conf-order-number').textContent = order.order_number;
        
        const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        document.getElementById('conf-status-text').textContent = statusText;
        if (order.payment_status === 'pending') {
          document.getElementById('conf-status').className = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700';
          document.getElementById('conf-status').innerHTML = '<i class="fas fa-clock"></i> <span>Payment Pending (COD)</span>';
        }

        // Items
        document.getElementById('conf-items').innerHTML = (order.items || []).map(item =>
          '<div class="flex items-center gap-3 p-3 bg-brand-pink-soft/20 rounded-xl">' +
          (item.image_url ? '<img src="' + item.image_url + '" class="w-12 h-12 rounded-lg object-cover">' : '<div class="w-12 h-12 rounded-lg bg-brand-pink-soft flex items-center justify-center"><i class="fas fa-gift text-brand-pink"></i></div>') +
          '<div class="flex-1"><p class="text-sm font-medium text-brand-maroon">' + item.name + '</p><p class="text-xs text-brand-maroon/50">Qty: ' + item.quantity + '</p></div>' +
          '<span class="font-semibold text-brand-maroon">\\u20B9' + (item.price * item.quantity).toLocaleString('en-IN') + '</span></div>'
        ).join('');

        // Pricing
        document.getElementById('conf-subtotal').textContent = '\\u20B9' + (order.subtotal || 0).toLocaleString('en-IN');
        document.getElementById('conf-shipping').textContent = order.shipping_cost > 0 ? '\\u20B9' + order.shipping_cost : 'FREE';
        if (order.discount_amount > 0) {
          document.getElementById('conf-discount-row').classList.remove('hidden');
          document.getElementById('conf-discount').textContent = '-\\u20B9' + order.discount_amount.toLocaleString('en-IN');
        }
        document.getElementById('conf-total').textContent = '\\u20B9' + order.total_amount.toLocaleString('en-IN');

        // Address
        if (order.shipping_address_json) {
          try {
            const addr = JSON.parse(order.shipping_address_json);
            document.getElementById('conf-address').innerHTML =
              '<p class="font-medium text-brand-maroon">' + addr.full_name + '</p>' +
              '<p>' + addr.address_line1 + (addr.address_line2 ? ', ' + addr.address_line2 : '') + '</p>' +
              '<p>' + addr.city + ', ' + addr.state + ' - ' + addr.pincode + '</p>' +
              '<p>' + addr.phone + '</p>';
          } catch(e) {}
        }

        // Gift message
        if (order.gift_message) {
          document.getElementById('conf-gift-section').classList.remove('hidden');
          document.getElementById('conf-gift-message').textContent = '"' + order.gift_message + '"';
        }

      } catch(e) { showNotFound(); }
    }

    function showNotFound() {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('not-found').classList.remove('hidden');
    }

    loadOrder();
  </script>
</body>
</html>`
}
