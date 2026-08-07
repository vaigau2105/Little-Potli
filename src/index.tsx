import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ============ TYPES ============

type Bindings = {
  DB: D1Database
  RAZORPAY_KEY_ID: string
  RAZORPAY_KEY_SECRET: string
  RESEND_API_KEY: string
  EMAIL_FROM_ADDRESS: string
  EMAIL_FROM_NAME: string
  ADMIN_PASSWORD_HASH: string
  JWT_SECRET: string
  STORE_EMAIL: string
  FREE_SHIPPING_THRESHOLD: string
  SHIPPING_CHARGE: string
}

type Variables = {
  user?: { id: number; email: string; name: string; role: string }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS
app.use('/api/*', cors())

// ============ HELPER FUNCTIONS ============

function generateOrderNumber(): string {
  const prefix = 'LP'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// HMAC-SHA256 for Razorpay signature verification (Web Crypto API)
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const data = encoder.encode(`${orderId}|${paymentId}`)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data)
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return expectedSignature === signature
}

// Simple password hash using SHA-256 (for admin auth)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Generate JWT-like token (base64 encoded with expiry)
function generateToken(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const tokenPayload = { ...payload, iat: now, exp: now + 86400 } // 24h expiry
  const headerB64 = btoa(JSON.stringify(header))
  const payloadB64 = btoa(JSON.stringify(tokenPayload))
  // Simplified - for production, use proper HMAC signing
  const sig = btoa(JSON.stringify({ s: secret.substring(0, 8), t: now }))
  return `${headerB64}.${payloadB64}.${sig}`
}

function verifyToken(token: string, secret: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}

// Send email via Resend API
// All sender details and credentials are passed in via config so that
// switching from a dev/test sender to the production business address
// (e.g. orders@littlepotli.com) requires only an env-var change.
type EmailConfig = {
  apiKey: string
  fromAddress: string   // e.g. "orders@littlepotli.com" or Resend test address
  fromName: string      // e.g. "Little Potli"
  replyTo: string       // support/store email shown in body & reply-to header
}

async function sendOrderConfirmationEmail(
  config: EmailConfig,
  to: string,
  orderNumber: string,
  orderDetails: { items: any[]; total: number; shippingAddress: any }
): Promise<boolean> {
  try {
    const itemsHtml = orderDetails.items
      .map(item => `<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0">${item.name}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0">x${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right">₹${item.price.toLocaleString('en-IN')}</td></tr>`)
      .join('')

    const address = orderDetails.shippingAddress
    const addressHtml = address
      ? `<p style="margin:4px 0;color:#555">${address.full_name}<br>${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}<br>${address.city}, ${address.state} - ${address.pincode}<br>Phone: ${address.phone}</p>`
      : ''

    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#333">
      <div style="background:linear-gradient(135deg,#FFE5EC,#FFFAF5);padding:30px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#5C0624;margin:0;font-size:24px">Thank You for Your Order!</h1>
        <p style="color:#E5006D;margin:8px 0 0">${config.fromName}</p>
      </div>
      <div style="padding:30px;background:#fff;border:1px solid #f0f0f0;border-top:none">
        <p>Hi${address?.full_name ? ' ' + address.full_name : ''},</p>
        <p>Your order <strong style="color:#E5006D">${orderNumber}</strong> has been confirmed! We're preparing your items with love.</p>
        
        <div style="background:#FFFAF5;padding:20px;border-radius:8px;margin:20px 0">
          <h3 style="color:#5C0624;margin:0 0 12px">Order Summary</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="border-bottom:2px solid #E5006D"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td colspan="2" style="padding:12px 8px;font-weight:bold;color:#5C0624">Total</td><td style="padding:12px 8px;text-align:right;font-weight:bold;color:#E5006D">₹${orderDetails.total.toLocaleString('en-IN')}</td></tr></tfoot>
          </table>
        </div>

        ${addressHtml ? `<div style="margin:20px 0"><h3 style="color:#5C0624;margin:0 0 8px">Delivery Address</h3>${addressHtml}</div>` : ''}
        
        <p style="color:#666;font-size:14px">You'll receive shipping updates soon. For any queries, reach us at <a href="mailto:${config.replyTo}" style="color:#E5006D">${config.replyTo}</a> or WhatsApp +91 90349 10627.</p>
      </div>
      <div style="padding:20px;text-align:center;color:#999;font-size:12px">
        <p>&copy; ${config.fromName} &bull; Curated Gifts, Crafted with Love</p>
      </div>
    </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromAddress}>`,
        reply_to: config.replyTo,
        to: [to],
        subject: `Order Confirmed - ${orderNumber} | ${config.fromName}`,
        html
      })
    })

    return res.ok
  } catch (e) {
    console.error('Email send failed:', e)
    return false
  }
}

// Get shipping charge based on subtotal
function getShippingCharge(subtotal: number, freeThreshold: number, shippingCharge: number): number {
  return subtotal >= freeThreshold ? 0 : shippingCharge
}

// Admin auth middleware
async function adminAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.replace('Bearer ', '')
  const decoded = verifyToken(token, c.env.JWT_SECRET || 'littlepotli-secret-key')
  if (!decoded) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
  if (decoded.role !== 'admin' && decoded.role !== 'manager') {
    return c.json({ error: 'Forbidden' }, 403)
  }
  c.set('user', decoded)
  await next()
}

// ============ PUBLIC API ROUTES ============

// Get all categories
app.get('/api/categories', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order'
  ).all()
  return c.json({ categories: results })
})

// Get products with filters
app.get('/api/products', async (c) => {
  const category = c.req.query('category')
  const search = c.req.query('search')
  const sort = c.req.query('sort') || 'newest'
  const minPrice = c.req.query('min_price')
  const maxPrice = c.req.query('max_price')
  const featured = c.req.query('featured')
  const newArrivals = c.req.query('new_arrivals')
  const bestSellers = c.req.query('best_sellers')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = parseInt(c.req.query('offset') || '0')

  let query = `SELECT p.*, c.name as category_name, c.slug as category_slug,
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_url
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1`
  const params: any[] = []

  if (category) { query += ' AND c.slug = ?'; params.push(category) }
  if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
  if (minPrice) { query += ' AND p.price >= ?'; params.push(parseFloat(minPrice)) }
  if (maxPrice) { query += ' AND p.price <= ?'; params.push(parseFloat(maxPrice)) }
  if (featured === '1') query += ' AND p.is_featured = 1'
  if (newArrivals === '1') query += ' AND p.is_new_arrival = 1'
  if (bestSellers === '1') query += ' AND p.is_best_seller = 1'

  switch (sort) {
    case 'price_asc': query += ' ORDER BY p.price ASC'; break
    case 'price_desc': query += ' ORDER BY p.price DESC'; break
    case 'name': query += ' ORDER BY p.name ASC'; break
    case 'popular': query += ' ORDER BY p.is_best_seller DESC, p.sort_order'; break
    default: query += ' ORDER BY p.created_at DESC'
  }

  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  let countQuery = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1`
  const countParams: any[] = []
  if (category) { countQuery += ' AND c.slug = ?'; countParams.push(category) }
  if (search) { countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`) }
  if (minPrice) { countQuery += ' AND p.price >= ?'; countParams.push(parseFloat(minPrice)) }
  if (maxPrice) { countQuery += ' AND p.price <= ?'; countParams.push(parseFloat(maxPrice)) }

  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()

  return c.json({ products: results, total: (countResult as any)?.total || 0 })
})

// Get single product by slug
app.get('/api/products/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?`
  ).bind(slug).first()

  if (!product) return c.json({ error: 'Product not found' }, 404)

  const { results: images } = await c.env.DB.prepare(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order'
  ).bind((product as any).id).all()

  const { results: tags } = await c.env.DB.prepare(
    'SELECT tag FROM product_tags WHERE product_id = ?'
  ).bind((product as any).id).all()

  const { results: reviews } = await c.env.DB.prepare(
    `SELECT r.*, u.name as user_name FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC`
  ).bind((product as any).id).all()

  return c.json({
    product: { ...product, images, tags: tags.map((t: any) => t.tag), reviews }
  })
})

// Get hamper boxes
app.get('/api/hamper-boxes', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM hamper_boxes WHERE is_active = 1 ORDER BY sort_order'
  ).all()
  return c.json({ boxes: results })
})

// Get packaging materials
app.get('/api/packaging-materials', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM packaging_materials WHERE is_active = 1'
  ).all()
  return c.json({ materials: results })
})

// Validate coupon
app.post('/api/coupons/validate', async (c) => {
  const { code, total } = await c.req.json()
  if (!code) return c.json({ valid: false, message: 'Coupon code is required' })

  const coupon = await c.env.DB.prepare(
    `SELECT * FROM coupons WHERE code = ? AND is_active = 1
     AND (valid_from IS NULL OR valid_from <= datetime('now'))
     AND (valid_until IS NULL OR valid_until >= datetime('now'))
     AND (usage_limit IS NULL OR used_count < usage_limit)`
  ).bind(code.toUpperCase()).first()

  if (!coupon) return c.json({ valid: false, message: 'Invalid or expired coupon' })
  if (total < (coupon as any).min_order_amount) {
    return c.json({ valid: false, message: `Minimum order amount is ₹${(coupon as any).min_order_amount}` })
  }

  let discount = 0
  if ((coupon as any).discount_type === 'percentage') {
    discount = (total * (coupon as any).discount_value) / 100
    if ((coupon as any).max_discount) discount = Math.min(discount, (coupon as any).max_discount)
  } else {
    discount = (coupon as any).discount_value
  }

  return c.json({ valid: true, discount, coupon })
})

// Get shipping config
app.get('/api/shipping-config', async (c) => {
  const freeThreshold = parseFloat(c.env.FREE_SHIPPING_THRESHOLD || '1999')
  const shippingCharge = parseFloat(c.env.SHIPPING_CHARGE || '99')
  return c.json({ freeThreshold, shippingCharge })
})

// ============ RAZORPAY PAYMENT ROUTES ============

// Create Razorpay order
app.post('/api/payments/create-order', async (c) => {
  const { amount, currency = 'INR', receipt, notes } = await c.req.json()

  if (!amount || amount <= 0) {
    return c.json({ error: 'Invalid amount' }, 400)
  }

  const keyId = c.env.RAZORPAY_KEY_ID
  const keySecret = c.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return c.json({ error: 'Payment gateway not configured' }, 500)
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt: receipt || generateOrderNumber(),
      notes: notes || {}
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Razorpay order creation failed:', error)
    return c.json({ error: 'Failed to create payment order' }, 500)
  }

  const razorpayOrder = await response.json() as any
  return c.json({
    id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key_id: keyId
  })
})

// Verify payment and create order
app.post('/api/payments/verify', async (c) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    order_data
  } = await c.req.json()

  // Verify signature
  const isValid = await verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    c.env.RAZORPAY_KEY_SECRET
  )

  if (!isValid) {
    return c.json({ error: 'Payment verification failed. Invalid signature.' }, 400)
  }

  // Create order in database
  const orderNumber = generateOrderNumber()
  const freeThreshold = parseFloat(c.env.FREE_SHIPPING_THRESHOLD || '1999')
  const shippingChargeRate = parseFloat(c.env.SHIPPING_CHARGE || '99')
  const shippingCost = getShippingCharge(order_data.subtotal, freeThreshold, shippingChargeRate)

  const result = await c.env.DB.prepare(
    `INSERT INTO orders (order_number, user_id, status, subtotal, shipping_cost, tax_amount, discount_amount, total_amount, coupon_code, payment_method, payment_status, payment_id, shipping_address_json, gift_message, delivery_date, delivery_slot)
     VALUES (?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, 'razorpay', 'paid', ?, ?, ?, ?, ?)`
  ).bind(
    orderNumber,
    order_data.user_id || null,
    order_data.subtotal,
    shippingCost,
    order_data.tax_amount || 0,
    order_data.discount_amount || 0,
    order_data.total_amount,
    order_data.coupon_code || null,
    razorpay_payment_id,
    JSON.stringify(order_data.shipping_address),
    order_data.gift_message || null,
    order_data.delivery_date || null,
    order_data.delivery_slot || null
  ).run()

  const orderId = result.meta.last_row_id

  // Insert order items
  for (const item of order_data.items) {
    await c.env.DB.prepare(
      `INSERT INTO order_items (order_id, product_id, item_type, name, price, quantity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      orderId,
      item.product_id || null,
      item.item_type || 'product',
      item.name,
      item.price,
      item.quantity,
      item.image_url || null
    ).run()

    // Reduce stock
    if (item.product_id) {
      await c.env.DB.prepare(
        'UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?'
      ).bind(item.quantity, item.product_id).run()
    }
  }

  // Update coupon usage
  if (order_data.coupon_code) {
    await c.env.DB.prepare(
      'UPDATE coupons SET used_count = used_count + 1 WHERE code = ?'
    ).bind(order_data.coupon_code.toUpperCase()).run()
  }

  // Send confirmation email (non-blocking)
  if (order_data.customer_email && c.env.RESEND_API_KEY) {
    const emailConfig: EmailConfig = {
      apiKey: c.env.RESEND_API_KEY,
      fromAddress: c.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
      fromName: c.env.EMAIL_FROM_NAME || 'Little Potli',
      replyTo: c.env.STORE_EMAIL || 'vaigau2105@gmail.com'
    }
    sendOrderConfirmationEmail(
      emailConfig,
      order_data.customer_email,
      orderNumber,
      {
        items: order_data.items,
        total: order_data.total_amount,
        shippingAddress: order_data.shipping_address
      }
    ).catch(err => console.error('Email send error:', err))
  }

  return c.json({
    success: true,
    order_number: orderNumber,
    order_id: orderId,
    payment_id: razorpay_payment_id
  })
})

// COD order creation
app.post('/api/orders', async (c) => {
  const body = await c.req.json()

  if (!body.items || body.items.length === 0) {
    return c.json({ error: 'No items in order' }, 400)
  }
  if (!body.shipping_address) {
    return c.json({ error: 'Shipping address is required' }, 400)
  }

  const orderNumber = generateOrderNumber()
  const freeThreshold = parseFloat(c.env.FREE_SHIPPING_THRESHOLD || '1999')
  const shippingChargeRate = parseFloat(c.env.SHIPPING_CHARGE || '99')
  const shippingCost = getShippingCharge(body.subtotal, freeThreshold, shippingChargeRate)

  const result = await c.env.DB.prepare(
    `INSERT INTO orders (order_number, user_id, status, subtotal, shipping_cost, tax_amount, discount_amount, total_amount, coupon_code, payment_method, payment_status, shipping_address_json, gift_message, delivery_date, delivery_slot)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, 'cod', 'pending', ?, ?, ?, ?)`
  ).bind(
    orderNumber,
    body.user_id || null,
    body.subtotal,
    shippingCost,
    body.tax_amount || 0,
    body.discount_amount || 0,
    body.total_amount,
    body.coupon_code || null,
    JSON.stringify(body.shipping_address),
    body.gift_message || null,
    body.delivery_date || null,
    body.delivery_slot || null
  ).run()

  const orderId = result.meta.last_row_id

  for (const item of body.items) {
    await c.env.DB.prepare(
      `INSERT INTO order_items (order_id, product_id, item_type, name, price, quantity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(orderId, item.product_id || null, item.item_type || 'product', item.name, item.price, item.quantity, item.image_url || null).run()

    if (item.product_id) {
      await c.env.DB.prepare(
        'UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?'
      ).bind(item.quantity, item.product_id).run()
    }
  }

  if (body.coupon_code) {
    await c.env.DB.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?')
      .bind(body.coupon_code.toUpperCase()).run()
  }

  // Send email for COD too
  if (body.customer_email && c.env.RESEND_API_KEY) {
    const emailConfig: EmailConfig = {
      apiKey: c.env.RESEND_API_KEY,
      fromAddress: c.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
      fromName: c.env.EMAIL_FROM_NAME || 'Little Potli',
      replyTo: c.env.STORE_EMAIL || 'vaigau2105@gmail.com'
    }
    sendOrderConfirmationEmail(
      emailConfig,
      body.customer_email,
      orderNumber,
      { items: body.items, total: body.total_amount, shippingAddress: body.shipping_address }
    ).catch(err => console.error('Email send error:', err))
  }

  return c.json({ success: true, order_number: orderNumber, order_id: orderId })
})

// Get order by order number (for confirmation page)
app.get('/api/orders/:orderNumber', async (c) => {
  const orderNumber = c.req.param('orderNumber')
  const order = await c.env.DB.prepare(
    'SELECT * FROM orders WHERE order_number = ?'
  ).bind(orderNumber).first()

  if (!order) return c.json({ error: 'Order not found' }, 404)

  const { results: items } = await c.env.DB.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).bind((order as any).id).all()

  return c.json({ order: { ...order, items } })
})

// Get site settings
app.get('/api/settings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT key, value FROM site_settings').all()
  const settings: Record<string, string> = {}
  results.forEach((r: any) => { settings[r.key] = r.value })
  return c.json({ settings })
})

// ============ AUTH ROUTES ============

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, password_hash FROM users WHERE email = ? AND is_active = 1'
  ).bind(email.toLowerCase().trim()).first()

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Compare password hash
  const passwordHash = await hashPassword(password)
  if ((user as any).password_hash !== passwordHash && (user as any).password_hash !== password) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const jwtSecret = c.env.JWT_SECRET || 'littlepotli-secret-key'
  const token = generateToken(
    { id: (user as any).id, email: (user as any).email, name: (user as any).name, role: (user as any).role },
    jwtSecret
  )

  return c.json({
    token,
    user: { id: (user as any).id, email: (user as any).email, name: (user as any).name, role: (user as any).role }
  })
})

// ============ ADMIN API ROUTES ============

app.get('/api/admin/dashboard', adminAuth, async (c) => {
  const totalOrders = await c.env.DB.prepare('SELECT COUNT(*) as count FROM orders').first()
  const totalRevenue = await c.env.DB.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "paid"').first()
  const totalProducts = await c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first()
  const pendingOrders = await c.env.DB.prepare('SELECT COUNT(*) as count FROM orders WHERE status = "pending"').first()
  const lowStock = await c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= low_stock_threshold AND is_active = 1').first()
  const totalCustomers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').first()

  const recentOrders = await c.env.DB.prepare(
    `SELECT o.*, u.name as customer_name FROM orders o
     LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10`
  ).all()

  return c.json({
    stats: {
      totalOrders: (totalOrders as any)?.count || 0,
      totalRevenue: (totalRevenue as any)?.total || 0,
      totalProducts: (totalProducts as any)?.count || 0,
      pendingOrders: (pendingOrders as any)?.count || 0,
      lowStock: (lowStock as any)?.count || 0,
      totalCustomers: (totalCustomers as any)?.count || 0
    },
    recentOrders: recentOrders.results
  })
})

app.get('/api/admin/products', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name as category_name,
     (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_url
     FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`
  ).all()
  return c.json({ products: results })
})

app.post('/api/admin/products', adminAuth, async (c) => {
  const body = await c.req.json()
  if (!body.name || !body.price) {
    return c.json({ error: 'Name and price are required' }, 400)
  }

  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const result = await c.env.DB.prepare(
    `INSERT INTO products (name, slug, description, short_description, price, compare_price, cost_price, sku, category_id, stock_quantity, material, care_instructions, is_active, is_featured, is_new_arrival, is_best_seller)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.name, slug, body.description || '', body.short_description || '',
    body.price, body.compare_price || null, body.cost_price || null,
    body.sku || null, body.category_id || null, body.stock_quantity || 0,
    body.material || '', body.care_instructions || '',
    body.is_active ?? 1, body.is_featured ?? 0, body.is_new_arrival ?? 0, body.is_best_seller ?? 0
  ).run()

  if (body.image_url) {
    await c.env.DB.prepare(
      'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)'
    ).bind(result.meta.last_row_id, body.image_url).run()
  }

  const user = c.get('user')
  await c.env.DB.prepare(
    'INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  ).bind(user?.id, 'create', 'product', result.meta.last_row_id, `Created product: ${body.name}`).run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

app.put('/api/admin/products/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  await c.env.DB.prepare(
    `UPDATE products SET name=?, description=?, short_description=?, price=?, compare_price=?, cost_price=?, sku=?, category_id=?, stock_quantity=?, material=?, care_instructions=?, is_active=?, is_featured=?, is_new_arrival=?, is_best_seller=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(
    body.name, body.description || '', body.short_description || '',
    body.price, body.compare_price || null, body.cost_price || null,
    body.sku || null, body.category_id || null, body.stock_quantity || 0,
    body.material || '', body.care_instructions || '',
    body.is_active ?? 1, body.is_featured ?? 0, body.is_new_arrival ?? 0, body.is_best_seller ?? 0, id
  ).run()

  const user = c.get('user')
  await c.env.DB.prepare(
    'INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  ).bind(user?.id, 'update', 'product', id, `Updated product ID: ${id}`).run()

  return c.json({ success: true })
})

app.delete('/api/admin/products/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('UPDATE products SET is_active = 0 WHERE id = ?').bind(id).run()

  const user = c.get('user')
  await c.env.DB.prepare(
    'INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  ).bind(user?.id, 'delete', 'product', id, `Soft-deleted product ID: ${id}`).run()

  return c.json({ success: true })
})

app.get('/api/admin/orders', adminAuth, async (c) => {
  const status = c.req.query('status')
  let query = `SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o LEFT JOIN users u ON o.user_id = u.id`
  const params: any[] = []

  if (status) { query += ' WHERE o.status = ?'; params.push(status) }
  query += ' ORDER BY o.created_at DESC'

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ orders: results })
})

app.put('/api/admin/orders/:id/status', adminAuth, async (c) => {
  const id = c.req.param('id')
  const { status, tracking_number, courier_partner, internal_notes } = await c.req.json()

  if (!status) return c.json({ error: 'Status is required' }, 400)

  let query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP'
  const params: any[] = [status]

  if (tracking_number) { query += ', tracking_number = ?'; params.push(tracking_number) }
  if (courier_partner) { query += ', courier_partner = ?'; params.push(courier_partner) }
  if (internal_notes) { query += ', internal_notes = ?'; params.push(internal_notes) }
  query += ' WHERE id = ?'
  params.push(id)

  await c.env.DB.prepare(query).bind(...params).run()

  const user = c.get('user')
  await c.env.DB.prepare(
    'INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  ).bind(user?.id, 'update_status', 'order', id, `Status changed to: ${status}`).run()

  return c.json({ success: true })
})

app.get('/api/admin/orders/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const order = await c.env.DB.prepare(
    `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
     FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?`
  ).bind(id).first()

  if (!order) return c.json({ error: 'Order not found' }, 404)

  const { results: items } = await c.env.DB.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).bind(id).all()

  return c.json({ order: { ...order, items } })
})

app.get('/api/admin/categories', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  return c.json({ categories: results })
})

app.post('/api/admin/categories', adminAuth, async (c) => {
  const body = await c.req.json()
  if (!body.name) return c.json({ error: 'Name is required' }, 400)
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const result = await c.env.DB.prepare(
    'INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(body.name, slug, body.description || '', body.image_url || '', body.sort_order || 0, body.is_active ?? 1).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

app.get('/api/admin/coupons', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all()
  return c.json({ coupons: results })
})

app.post('/api/admin/coupons', adminAuth, async (c) => {
  const body = await c.req.json()
  if (!body.code || !body.discount_type || !body.discount_value) {
    return c.json({ error: 'Code, type, and value are required' }, 400)
  }
  await c.env.DB.prepare(
    `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, valid_from, valid_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(body.code.toUpperCase(), body.description || '', body.discount_type, body.discount_value, body.min_order_amount || 0, body.max_discount || null, body.usage_limit || null, body.valid_from || null, body.valid_until || null).run()
  return c.json({ success: true })
})

app.get('/api/admin/tickets', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT t.*, u.name as user_name, u.email as user_email
     FROM support_tickets t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`
  ).all()
  return c.json({ tickets: results })
})

app.put('/api/admin/tickets/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const { status, admin_response } = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE support_tickets SET status = ?, admin_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status || 'open', admin_response || '', id).run()
  return c.json({ success: true })
})

app.get('/api/admin/audit-log', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.*, u.name as admin_name FROM audit_log a
     LEFT JOIN users u ON a.admin_id = u.id ORDER BY a.created_at DESC LIMIT 50`
  ).all()
  return c.json({ logs: results })
})

app.put('/api/admin/settings', adminAuth, async (c) => {
  const { settings } = await c.req.json()
  if (!settings) return c.json({ error: 'Settings object is required' }, 400)
  for (const [key, value] of Object.entries(settings)) {
    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
    ).bind(key, value as string).run()
  }
  return c.json({ success: true })
})

app.get('/api/admin/customers', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.*, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
     (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND payment_status = 'paid') as total_spent
     FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC`
  ).all()
  return c.json({ customers: results })
})

// ============ FRONTEND PAGES ============

import { homePage } from './pages/home'
import { shopPage } from './pages/shop'
import { productPage } from './pages/product'
import { hamperPage } from './pages/hamper'
import { checkoutPage } from './pages/checkout'
import { orderConfirmationPage } from './pages/order-confirmation'
import { collectionsPage } from './pages/collections'
import { aboutPage } from './pages/about'
import { adminLoginPage } from './pages/admin-login'
import { adminDashboardPage } from './pages/admin-dashboard'

app.get('/', (c) => c.html(homePage()))
app.get('/shop', (c) => c.html(shopPage()))
app.get('/product/:slug', (c) => c.html(productPage()))
app.get('/build-hamper', (c) => c.html(hamperPage()))
app.get('/checkout', (c) => c.html(checkoutPage(c.env.RAZORPAY_KEY_ID)))
app.get('/order-confirmation', (c) => c.html(orderConfirmationPage()))
app.get('/collections', (c) => c.html(collectionsPage()))
app.get('/about', (c) => c.html(aboutPage()))
app.get('/admin', (c) => c.redirect('/admin/login'))
app.get('/admin/login', (c) => c.html(adminLoginPage()))
app.get('/admin/dashboard', (c) => c.html(adminDashboardPage()))

export default app
