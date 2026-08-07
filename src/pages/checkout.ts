import { htmlHead, navBar, cartScript } from './layout'

export function checkoutPage(razorpayKeyId: string): string {
  return `${htmlHead('Checkout', '<script src="https://checkout.razorpay.com/v1/checkout.js"></script>')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar()}

  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav class="mb-6 text-sm text-brand-maroon/60">
      <a href="/" class="hover:text-brand-pink">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
      <a href="/shop" class="hover:text-brand-pink">Shop</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
      <span class="text-brand-maroon">Checkout</span>
    </nav>

    <h1 class="font-serif text-3xl md:text-4xl font-bold text-brand-maroon mb-8">Checkout</h1>

    <div id="empty-cart-msg" class="hidden text-center py-16">
      <i class="fas fa-shopping-bag text-5xl text-brand-pink-light mb-4"></i>
      <h2 class="font-serif text-2xl text-brand-maroon mb-2">Your bag is empty</h2>
      <p class="text-brand-maroon/60 mb-6">Add some items before checking out.</p>
      <a href="/shop" class="px-6 py-3 bg-brand-pink text-white rounded-full font-medium hover:bg-brand-pink-hover">Continue Shopping</a>
    </div>

    <div id="checkout-form" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Contact -->
        <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6">
          <h2 class="font-serif text-xl font-bold text-brand-maroon mb-4"><i class="fas fa-user mr-2 text-brand-pink"></i>Contact Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-brand-maroon mb-1">Full Name *</label>
              <input type="text" id="co-name" required class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="Your full name">
            </div>
            <div>
              <label class="block text-sm font-medium text-brand-maroon mb-1">Email *</label>
              <input type="email" id="co-email" required class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="your@email.com">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-brand-maroon mb-1">Phone *</label>
              <input type="tel" id="co-phone" required class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="+91 9XXXXXXXXX">
            </div>
          </div>
        </div>

        <!-- Shipping Address -->
        <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6">
          <h2 class="font-serif text-xl font-bold text-brand-maroon mb-4"><i class="fas fa-map-marker-alt mr-2 text-brand-pink"></i>Shipping Address</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-brand-maroon mb-1">Address Line 1 *</label>
              <input type="text" id="co-address1" required class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="House/Flat No., Street">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-brand-maroon mb-1">Address Line 2</label>
              <input type="text" id="co-address2" class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="Landmark, Area (Optional)">
            </div>
            <div>
              <label class="block text-sm font-medium text-brand-maroon mb-1">City *</label>
              <input type="text" id="co-city" required class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="City">
            </div>
            <div>
              <label class="block text-sm font-medium text-brand-maroon mb-1">State *</label>
              <input type="text" id="co-state" required class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="State">
            </div>
            <div>
              <label class="block text-sm font-medium text-brand-maroon mb-1">Pincode *</label>
              <input type="text" id="co-pincode" required pattern="[0-9]{6}" class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm" placeholder="6-digit pincode">
            </div>
            <div>
              <label class="block text-sm font-medium text-brand-maroon mb-1">Country</label>
              <input type="text" id="co-country" value="India" readonly class="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
            </div>
          </div>
        </div>

        <!-- Gift Message -->
        <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6">
          <h2 class="font-serif text-xl font-bold text-brand-maroon mb-4"><i class="fas fa-gift mr-2 text-brand-pink"></i>Gift Message (Optional)</h2>
          <textarea id="co-gift-message" rows="3" class="w-full p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm resize-none" placeholder="Add a heartfelt message for the recipient..."></textarea>
        </div>

        <!-- Coupon -->
        <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6">
          <h2 class="font-serif text-xl font-bold text-brand-maroon mb-4"><i class="fas fa-ticket-alt mr-2 text-brand-pink"></i>Coupon Code</h2>
          <div class="flex gap-2">
            <input type="text" id="co-coupon" class="flex-1 p-3 rounded-xl border border-brand-pink-light focus:border-brand-pink outline-none text-sm uppercase" placeholder="Enter coupon code">
            <button onclick="applyCoupon()" class="px-6 py-3 bg-brand-gold text-white rounded-xl text-sm font-medium hover:bg-brand-gold/90 transition-colors">Apply</button>
          </div>
          <p id="coupon-msg" class="text-sm mt-2 hidden"></p>
        </div>

        <!-- Payment Method -->
        <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6">
          <h2 class="font-serif text-xl font-bold text-brand-maroon mb-4"><i class="fas fa-credit-card mr-2 text-brand-pink"></i>Payment Method</h2>
          <div class="space-y-3">
            <label class="flex items-center gap-3 p-4 rounded-xl border border-brand-pink-light cursor-pointer hover:bg-brand-pink-soft/30 transition-colors has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink-soft/50">
              <input type="radio" name="payment" value="razorpay" checked class="accent-brand-pink w-4 h-4">
              <div class="flex-1">
                <span class="font-medium text-brand-maroon text-sm">Pay Online</span>
                <p class="text-xs text-brand-maroon/50">UPI, Credit/Debit Card, Netbanking, Wallets</p>
              </div>
              <i class="fas fa-shield-alt text-green-500"></i>
            </label>
            <label class="flex items-center gap-3 p-4 rounded-xl border border-brand-pink-light cursor-pointer hover:bg-brand-pink-soft/30 transition-colors has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink-soft/50">
              <input type="radio" name="payment" value="cod" class="accent-brand-pink w-4 h-4">
              <div class="flex-1">
                <span class="font-medium text-brand-maroon text-sm">Cash on Delivery</span>
                <p class="text-xs text-brand-maroon/50">Pay when you receive your order</p>
              </div>
              <i class="fas fa-money-bill-wave text-brand-gold"></i>
            </label>
          </div>
        </div>
      </div>

      <!-- Right: Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6 sticky top-24">
          <h2 class="font-serif text-xl font-bold text-brand-maroon mb-4">Order Summary</h2>
          <div id="checkout-items" class="space-y-3 mb-4 max-h-64 overflow-y-auto"></div>
          <div class="border-t border-brand-pink-soft pt-4 space-y-2 text-sm">
            <div class="flex justify-between text-brand-maroon/70"><span>Subtotal</span><span id="co-subtotal">₹0</span></div>
            <div class="flex justify-between text-brand-maroon/70"><span>Shipping</span><span id="co-shipping">Calculating...</span></div>
            <div id="co-discount-row" class="flex justify-between text-green-600 hidden"><span>Discount</span><span id="co-discount">-₹0</span></div>
            <div class="border-t border-brand-pink-soft pt-3 flex justify-between font-bold text-brand-maroon text-lg">
              <span>Total</span><span id="co-total">₹0</span>
            </div>
          </div>
          <button id="place-order-btn" onclick="placeOrder()" class="w-full mt-6 py-4 bg-brand-pink text-white rounded-full font-semibold hover:bg-brand-pink-hover transition-all shadow-lg shadow-brand-pink/30 text-sm">
            <i class="fas fa-lock mr-2"></i> Place Order
          </button>
          <p class="text-center text-xs text-brand-maroon/40 mt-3"><i class="fas fa-shield-alt mr-1"></i> Secure checkout powered by Razorpay</p>
        </div>
      </div>
    </div>
  </main>

  ${cartScript()}
  <script>
    const RAZORPAY_KEY = '${razorpayKeyId || ''}';
    let shippingConfig = { freeThreshold: 1999, shippingCharge: 99 };
    let appliedDiscount = 0;
    let appliedCoupon = '';

    // Check cart
    if (cart.length === 0) {
      document.getElementById('checkout-form').classList.add('hidden');
      document.getElementById('empty-cart-msg').classList.remove('hidden');
    }

    // Load shipping config
    async function loadShippingConfig() {
      try {
        const res = await fetch('/api/shipping-config');
        shippingConfig = await res.json();
      } catch(e) {}
      renderSummary();
    }

    function renderSummary() {
      const itemsEl = document.getElementById('checkout-items');
      itemsEl.innerHTML = cart.map(item =>
        '<div class="flex gap-3 items-center">' +
        '<img src="' + (item.image || '') + '" class="w-12 h-12 rounded-lg object-cover border border-brand-pink-soft">' +
        '<div class="flex-1 min-w-0"><p class="text-sm font-medium text-brand-maroon truncate">' + item.name + '</p><p class="text-xs text-brand-maroon/50">Qty: ' + item.quantity + '</p></div>' +
        '<span class="text-sm font-semibold text-brand-maroon whitespace-nowrap">\\u20B9' + (item.price * item.quantity).toLocaleString('en-IN') + '</span></div>'
      ).join('');

      const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
      const shipping = subtotal >= shippingConfig.freeThreshold ? 0 : shippingConfig.shippingCharge;
      const total = subtotal + shipping - appliedDiscount;

      document.getElementById('co-subtotal').textContent = '\\u20B9' + subtotal.toLocaleString('en-IN');
      document.getElementById('co-shipping').textContent = shipping === 0 ? 'FREE' : '\\u20B9' + shipping;
      document.getElementById('co-shipping').className = shipping === 0 ? 'text-green-600 font-medium' : '';
      document.getElementById('co-total').textContent = '\\u20B9' + total.toLocaleString('en-IN');

      if (appliedDiscount > 0) {
        document.getElementById('co-discount-row').classList.remove('hidden');
        document.getElementById('co-discount').textContent = '-\\u20B9' + appliedDiscount.toLocaleString('en-IN');
      } else {
        document.getElementById('co-discount-row').classList.add('hidden');
      }
    }

    async function applyCoupon() {
      const code = document.getElementById('co-coupon').value.trim();
      const msgEl = document.getElementById('coupon-msg');
      if (!code) return;

      const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, total: subtotal })
      });
      const data = await res.json();

      msgEl.classList.remove('hidden');
      if (data.valid) {
        appliedDiscount = data.discount;
        appliedCoupon = code.toUpperCase();
        msgEl.textContent = '\\u2705 Coupon applied! You save \\u20B9' + data.discount.toLocaleString('en-IN');
        msgEl.className = 'text-sm mt-2 text-green-600';
      } else {
        appliedDiscount = 0;
        appliedCoupon = '';
        msgEl.textContent = '\\u274C ' + data.message;
        msgEl.className = 'text-sm mt-2 text-red-500';
      }
      renderSummary();
    }

    function validateForm() {
      const fields = ['co-name', 'co-email', 'co-phone', 'co-address1', 'co-city', 'co-state', 'co-pincode'];
      for (const f of fields) {
        const el = document.getElementById(f);
        if (!el.value.trim()) { el.focus(); el.classList.add('border-red-400'); return false; }
        el.classList.remove('border-red-400');
      }
      const pincode = document.getElementById('co-pincode').value;
      if (!/^[0-9]{6}$/.test(pincode)) { document.getElementById('co-pincode').focus(); alert('Please enter a valid 6-digit pincode'); return false; }
      const email = document.getElementById('co-email').value;
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) { document.getElementById('co-email').focus(); alert('Please enter a valid email'); return false; }
      return true;
    }

    function getOrderData() {
      const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
      const shipping = subtotal >= shippingConfig.freeThreshold ? 0 : shippingConfig.shippingCharge;
      const total = subtotal + shipping - appliedDiscount;
      return {
        items: cart.map(item => ({
          product_id: item.id && !String(item.id).startsWith('hamper-') ? item.id : null,
          item_type: item.type || 'product',
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image || null
        })),
        shipping_address: {
          full_name: document.getElementById('co-name').value.trim(),
          phone: document.getElementById('co-phone').value.trim(),
          address_line1: document.getElementById('co-address1').value.trim(),
          address_line2: document.getElementById('co-address2').value.trim(),
          city: document.getElementById('co-city').value.trim(),
          state: document.getElementById('co-state').value.trim(),
          pincode: document.getElementById('co-pincode').value.trim(),
          country: 'India'
        },
        customer_email: document.getElementById('co-email').value.trim(),
        gift_message: document.getElementById('co-gift-message').value.trim(),
        subtotal,
        shipping_cost: shipping,
        discount_amount: appliedDiscount,
        total_amount: total,
        coupon_code: appliedCoupon || null,
        tax_amount: 0
      };
    }

    async function placeOrder() {
      if (!validateForm()) return;
      if (cart.length === 0) { alert('Your cart is empty'); return; }

      const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
      const btn = document.getElementById('place-order-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

      const orderData = getOrderData();

      try {
        if (paymentMethod === 'razorpay') {
          // Create Razorpay order
          const createRes = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: orderData.total_amount,
              receipt: 'order_' + Date.now(),
              notes: { customer_name: orderData.shipping_address.full_name, email: orderData.customer_email }
            })
          });

          if (!createRes.ok) { throw new Error('Failed to create payment order'); }
          const rzpOrder = await createRes.json();

          // Open Razorpay checkout
          const options = {
            key: RAZORPAY_KEY,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            name: 'Little Potli',
            description: 'Order Payment',
            image: 'https://www.genspark.ai/api/files/s/xpWlRGhD',
            order_id: rzpOrder.id,
            handler: async function(response) {
              btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Verifying payment...';
              // Verify payment on backend
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_data: orderData
                })
              });
              const result = await verifyRes.json();
              if (result.success) {
                localStorage.removeItem('lp_cart');
                window.location.href = '/order-confirmation?order=' + result.order_number;
              } else {
                alert('Payment verification failed: ' + (result.error || 'Please contact support.'));
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Place Order';
              }
            },
            prefill: {
              name: orderData.shipping_address.full_name,
              email: orderData.customer_email,
              contact: orderData.shipping_address.phone
            },
            theme: { color: '#E5006D' },
            modal: {
              ondismiss: function() {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Place Order';
              }
            }
          };
          const rzp = new Razorpay(options);
          rzp.open();

        } else {
          // COD order
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          });
          const result = await res.json();
          if (result.success) {
            localStorage.removeItem('lp_cart');
            window.location.href = '/order-confirmation?order=' + result.order_number;
          } else {
            alert('Order failed: ' + (result.error || 'Please try again.'));
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Place Order';
          }
        }
      } catch (err) {
        console.error(err);
        alert('Something went wrong. Please try again.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Place Order';
      }
    }

    loadShippingConfig();
  </script>
</body>
</html>`
}
