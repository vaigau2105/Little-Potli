import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
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

// Simple auth middleware for admin routes
async function adminAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.replace('Bearer ', '')
  // Simple token validation (in production, use JWT)
  try {
    const decoded = JSON.parse(atob(token))
    if (decoded.role !== 'admin' && decoded.role !== 'manager') {
      return c.json({ error: 'Forbidden' }, 403)
    }
    c.set('user', decoded)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
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

  if (category) {
    query += ' AND c.slug = ?'
    params.push(category)
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (minPrice) {
    query += ' AND p.price >= ?'
    params.push(parseFloat(minPrice))
  }
  if (maxPrice) {
    query += ' AND p.price <= ?'
    params.push(parseFloat(maxPrice))
  }
  if (featured === '1') query += ' AND p.is_featured = 1'
  if (newArrivals === '1') query += ' AND p.is_new_arrival = 1'
  if (bestSellers === '1') query += ' AND p.is_best_seller = 1'

  // Sorting
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

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1`
  const countParams: any[] = []
  if (category) { countQuery += ' AND c.slug = ?'; countParams.push(category) }
  if (search) { countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`) }

  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()

  return c.json({ products: results, total: (countResult as any)?.total || 0 })
})

// Get single product by slug
app.get('/api/products/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ?`
  ).bind(slug).first()

  if (!product) return c.json({ error: 'Product not found' }, 404)

  // Get images
  const { results: images } = await c.env.DB.prepare(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order'
  ).bind(product.id).all()

  // Get tags
  const { results: tags } = await c.env.DB.prepare(
    'SELECT tag FROM product_tags WHERE product_id = ?'
  ).bind(product.id).all()

  // Get reviews
  const { results: reviews } = await c.env.DB.prepare(
    `SELECT r.*, u.name as user_name FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC`
  ).bind(product.id).all()

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

// Create order
app.post('/api/orders', async (c) => {
  const body = await c.req.json()
  const orderNumber = generateOrderNumber()

  const result = await c.env.DB.prepare(
    `INSERT INTO orders (order_number, user_id, subtotal, shipping_cost, tax_amount, discount_amount, total_amount, coupon_code, payment_method, shipping_address_json, gift_message, delivery_date, delivery_slot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    orderNumber, body.user_id || null, body.subtotal, body.shipping_cost || 0,
    body.tax_amount || 0, body.discount_amount || 0, body.total_amount,
    body.coupon_code || null, body.payment_method || 'COD',
    JSON.stringify(body.shipping_address), body.gift_message || null,
    body.delivery_date || null, body.delivery_slot || null
  ).run()

  const orderId = result.meta.last_row_id

  // Insert order items
  for (const item of body.items) {
    await c.env.DB.prepare(
      `INSERT INTO order_items (order_id, product_id, item_type, name, price, quantity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(orderId, item.product_id || null, item.item_type || 'product', item.name, item.price, item.quantity, item.image_url || null).run()
  }

  return c.json({ success: true, order_number: orderNumber, order_id: orderId })
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
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, password_hash FROM users WHERE email = ? AND is_active = 1'
  ).bind(email).first()

  if (!user || (user as any).password_hash !== password) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Generate simple token (in production use JWT)
  const token = btoa(JSON.stringify({
    id: (user as any).id,
    email: (user as any).email,
    name: (user as any).name,
    role: (user as any).role
  }))

  return c.json({
    token,
    user: { id: (user as any).id, email: (user as any).email, name: (user as any).name, role: (user as any).role }
  })
})

// ============ ADMIN API ROUTES ============

// Admin: Get dashboard stats
app.get('/api/admin/dashboard', adminAuth, async (c) => {
  const totalOrders = await c.env.DB.prepare('SELECT COUNT(*) as count FROM orders').first()
  const totalRevenue = await c.env.DB.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "paid"').first()
  const totalProducts = await c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first()
  const pendingOrders = await c.env.DB.prepare('SELECT COUNT(*) as count FROM orders WHERE status = "pending"').first()
  const lowStock = await c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= low_stock_threshold AND is_active = 1').first()
  const totalCustomers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').first()

  const recentOrders = await c.env.DB.prepare(
    `SELECT o.*, u.name as customer_name FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC LIMIT 10`
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

// Admin: Get all products
app.get('/api/admin/products', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name as category_name,
     (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_url
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     ORDER BY p.created_at DESC`
  ).all()
  return c.json({ products: results })
})

// Admin: Create product
app.post('/api/admin/products', adminAuth, async (c) => {
  const body = await c.req.json()
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

  // Add image if provided
  if (body.image_url) {
    await c.env.DB.prepare(
      'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)'
    ).bind(result.meta.last_row_id, body.image_url).run()
  }

  // Log action
  const user = c.get('user')
  await c.env.DB.prepare(
    'INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  ).bind(user?.id, 'create', 'product', result.meta.last_row_id, `Created product: ${body.name}`).run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

// Admin: Update product
app.put('/api/admin/products/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  await c.env.DB.prepare(
    `UPDATE products SET name=?, description=?, short_description=?, price=?, compare_price=?, cost_price=?, sku=?, category_id=?, stock_quantity=?, material=?, care_instructions=?, is_active=?, is_featured=?, is_new_arrival=?, is_best_seller=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).bind(
    body.name, body.description || '', body.short_description || '',
    body.price, body.compare_price || null, body.cost_price || null,
    body.sku || null, body.category_id || null, body.stock_quantity || 0,
    body.material || '', body.care_instructions || '',
    body.is_active ?? 1, body.is_featured ?? 0, body.is_new_arrival ?? 0, body.is_best_seller ?? 0,
    id
  ).run()

  return c.json({ success: true })
})

// Admin: Delete product
app.delete('/api/admin/products/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Admin: Get all orders
app.get('/api/admin/orders', adminAuth, async (c) => {
  const status = c.req.query('status')
  let query = `SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o LEFT JOIN users u ON o.user_id = u.id`
  const params: any[] = []

  if (status) {
    query += ' WHERE o.status = ?'
    params.push(status)
  }
  query += ' ORDER BY o.created_at DESC'

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ orders: results })
})

// Admin: Update order status
app.put('/api/admin/orders/:id/status', adminAuth, async (c) => {
  const id = c.req.param('id')
  const { status, tracking_number, courier_partner, internal_notes } = await c.req.json()

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

// Admin: Get order details
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

// Admin: Categories CRUD
app.get('/api/admin/categories', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  return c.json({ categories: results })
})

app.post('/api/admin/categories', adminAuth, async (c) => {
  const body = await c.req.json()
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const result = await c.env.DB.prepare(
    'INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(body.name, slug, body.description || '', body.image_url || '', body.sort_order || 0, body.is_active ?? 1).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

// Admin: Coupons
app.get('/api/admin/coupons', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all()
  return c.json({ coupons: results })
})

app.post('/api/admin/coupons', adminAuth, async (c) => {
  const body = await c.req.json()
  await c.env.DB.prepare(
    `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, valid_from, valid_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(body.code.toUpperCase(), body.description, body.discount_type, body.discount_value, body.min_order_amount || 0, body.max_discount || null, body.usage_limit || null, body.valid_from || null, body.valid_until || null).run()
  return c.json({ success: true })
})

// Admin: Support tickets
app.get('/api/admin/tickets', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT t.*, u.name as user_name, u.email as user_email
     FROM support_tickets t LEFT JOIN users u ON t.user_id = u.id
     ORDER BY t.created_at DESC`
  ).all()
  return c.json({ tickets: results })
})

app.put('/api/admin/tickets/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const { status, admin_response } = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE support_tickets SET status = ?, admin_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status, admin_response, id).run()
  return c.json({ success: true })
})

// Admin: Audit log
app.get('/api/admin/audit-log', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.*, u.name as admin_name FROM audit_log a
     LEFT JOIN users u ON a.admin_id = u.id
     ORDER BY a.created_at DESC LIMIT 50`
  ).all()
  return c.json({ logs: results })
})

// Admin: Update settings
app.put('/api/admin/settings', adminAuth, async (c) => {
  const { settings } = await c.req.json()
  for (const [key, value] of Object.entries(settings)) {
    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
    ).bind(key, value as string).run()
  }
  return c.json({ success: true })
})

// Admin: Customers
app.get('/api/admin/customers', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.*, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
     (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND payment_status = 'paid') as total_spent
     FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC`
  ).all()
  return c.json({ customers: results })
})

// ============ FRONTEND PAGES ============

// Shared HTML head with brand styling
const htmlHead = (title: string, extraHead = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Little Potli</title>
  <meta name="description" content="Little Potli - Curated Gifts, Crafted with Love. Discover handpicked accessories and build your perfect gift hamper.">
  <meta property="og:title" content="${title} | Little Potli">
  <meta property="og:description" content="Curated Gifts, Crafted with Love">
  <meta property="og:image" content="https://www.genspark.ai/api/files/s/J5d3zi11">
  <link rel="icon" href="https://www.genspark.ai/api/files/s/J5d3zi11" type="image/png">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              pink: '#E5006D',
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
    .gold-border { border-image: linear-gradient(135deg, #C9A96E, #E8D5B0) 1; }
    .shimmer { background: linear-gradient(90deg, transparent, rgba(201, 169, 110, 0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
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

// Customer Homepage
app.get('/', (c) => {
  return c.html(`${htmlHead('Home')}
<body class="bg-brand-ivory min-h-screen">
  <!-- Navigation -->
  <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-pink-soft shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        <a href="/" class="flex items-center gap-3">
          <img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 md:h-14 w-auto">
        </a>
        
        <div class="hidden md:flex items-center gap-8">
          <a href="/" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Home</a>
          <a href="/shop" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Shop</a>
          <a href="/collections" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Collections</a>
          <a href="/build-hamper" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">Build Hamper</a>
          <a href="/about" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink transition-colors">About</a>
        </div>

        <div class="flex items-center gap-4">
          <button onclick="toggleSearch()" class="text-brand-maroon hover:text-brand-pink transition-colors">
            <i class="fas fa-search text-lg"></i>
          </button>
          <a href="/wishlist" class="text-brand-maroon hover:text-brand-pink transition-colors relative">
            <i class="fas fa-heart text-lg"></i>
            <span id="wishlist-count" class="absolute -top-2 -right-2 bg-brand-pink text-white text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
          </a>
          <button onclick="toggleCart()" class="text-brand-maroon hover:text-brand-pink transition-colors relative">
            <i class="fas fa-shopping-bag text-lg"></i>
            <span id="cart-count" class="absolute -top-2 -right-2 bg-brand-pink text-white text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
          </button>
          <button class="md:hidden text-brand-maroon" onclick="toggleMobileMenu()">
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div id="search-bar" class="hidden border-t border-brand-pink-soft bg-white px-4 py-3">
      <div class="max-w-2xl mx-auto relative">
        <input type="text" id="search-input" placeholder="Search for earrings, bracelets, gift sets..." class="w-full pl-10 pr-4 py-2 rounded-full border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm">
        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-brand-pink-light"></i>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div id="mobile-menu" class="hidden md:hidden border-t border-brand-pink-soft bg-white">
      <div class="px-4 py-4 space-y-3">
        <a href="/" class="block text-brand-maroon font-medium py-2">Home</a>
        <a href="/shop" class="block text-brand-maroon font-medium py-2">Shop</a>
        <a href="/collections" class="block text-brand-maroon font-medium py-2">Collections</a>
        <a href="/build-hamper" class="block text-brand-maroon font-medium py-2">Build Hamper</a>
        <a href="/about" class="block text-brand-maroon font-medium py-2">About</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="brand-gradient relative overflow-hidden">
    <div class="absolute inset-0 opacity-5">
      <div class="absolute top-10 left-10 w-20 h-20 border border-brand-gold rounded-full"></div>
      <div class="absolute bottom-20 right-20 w-32 h-32 border border-brand-pink rounded-full"></div>
      <div class="absolute top-1/2 left-1/3 w-16 h-16 border border-brand-gold-light rounded-full"></div>
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
          <a href="/shop" class="inline-flex items-center justify-center px-8 py-3 bg-brand-pink text-white rounded-full font-medium text-sm tracking-wide hover:bg-brand-pink-hover transition-all shadow-lg shadow-brand-pink/30 hover:shadow-xl">
            <i class="fas fa-gem mr-2"></i> Explore Collection
          </a>
          <a href="/build-hamper" class="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-gold text-brand-maroon rounded-full font-medium text-sm tracking-wide hover:bg-brand-gold hover:text-white transition-all">
            <i class="fas fa-gift mr-2"></i> Build Your Hamper
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Featured Categories -->
  <section class="py-16 md:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Browse By</p>
        <h2 class="text-3xl md:text-4xl font-serif font-bold text-brand-maroon">Our Collections</h2>
      </div>
      <div id="categories-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <!-- Loaded dynamically -->
      </div>
    </div>
  </section>

  <!-- Featured Products -->
  <section class="py-16 md:py-20 brand-gradient">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Handpicked for You</p>
        <h2 class="text-3xl md:text-4xl font-serif font-bold text-brand-maroon">Featured Pieces</h2>
      </div>
      <div id="featured-products" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Loaded dynamically -->
      </div>
      <div class="text-center mt-10">
        <a href="/shop" class="inline-flex items-center px-8 py-3 border-2 border-brand-maroon text-brand-maroon rounded-full font-medium text-sm hover:bg-brand-maroon hover:text-white transition-all">
          View All Products <i class="fas fa-arrow-right ml-2"></i>
        </a>
      </div>
    </div>
  </section>

  <!-- Build Hamper CTA -->
  <section class="py-16 md:py-20 bg-white relative overflow-hidden">
    <div class="absolute top-0 right-0 w-64 h-64 bg-brand-pink-soft rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-48 h-48 bg-brand-gold-light rounded-full translate-y-1/2 -translate-x-1/2 opacity-30"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div class="bg-gradient-to-r from-brand-maroon to-brand-pink rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl">
        <h2 class="text-3xl md:text-5xl font-serif font-bold mb-4">Build Your Dream Hamper</h2>
        <p class="text-white/80 text-base md:text-lg mb-8 max-w-2xl mx-auto font-light">
          Choose your box, pick your accessories, add a personal touch, and create a gift that speaks from the heart.
        </p>
        <a href="/build-hamper" class="inline-flex items-center px-10 py-4 bg-white text-brand-pink rounded-full font-semibold text-sm tracking-wide hover:bg-brand-ivory transition-all shadow-lg">
          <i class="fas fa-magic mr-2"></i> Start Building
        </a>
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
      <div id="best-sellers" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Loaded dynamically -->
      </div>
    </div>
  </section>

  <!-- Why Choose Us -->
  <section class="py-16 md:py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-serif font-bold text-brand-maroon">Why Little Potli?</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center">
            <i class="fas fa-hand-holding-heart text-brand-pink text-2xl"></i>
          </div>
          <h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Handcrafted</h3>
          <p class="text-sm text-brand-maroon/60 font-light">Every piece is made with love and attention to detail</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center">
            <i class="fas fa-gift text-brand-pink text-2xl"></i>
          </div>
          <h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Custom Hampers</h3>
          <p class="text-sm text-brand-maroon/60 font-light">Build personalized gift hampers for any occasion</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center">
            <i class="fas fa-shipping-fast text-brand-pink text-2xl"></i>
          </div>
          <h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Pan-India Delivery</h3>
          <p class="text-sm text-brand-maroon/60 font-light">Free shipping on orders above ₹1,999</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-brand-pink-soft rounded-full flex items-center justify-center">
            <i class="fas fa-ribbon text-brand-pink text-2xl"></i>
          </div>
          <h3 class="font-serif text-xl font-semibold text-brand-maroon mb-2">Premium Packaging</h3>
          <p class="text-sm text-brand-maroon/60 font-light">Luxurious packaging that makes every gift special</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-brand-maroon text-white pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-16 mb-4 brightness-0 invert">
          <p class="text-white/70 text-sm font-light leading-relaxed">Curated Gifts, Crafted with Love. Making every celebration memorable with handpicked accessories and bespoke hampers.</p>
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
            <li><a href="/support" class="hover:text-brand-pink-light transition-colors">Contact Us</a></li>
            <li><a href="#" class="hover:text-brand-pink-light transition-colors">Shipping Policy</a></li>
            <li><a href="#" class="hover:text-brand-pink-light transition-colors">Returns & Exchanges</a></li>
            <li><a href="#" class="hover:text-brand-pink-light transition-colors">FAQs</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-serif text-lg font-semibold mb-4">Get in Touch</h4>
          <ul class="space-y-2 text-sm text-white/70">
            <li><i class="fas fa-envelope mr-2 text-brand-pink-light"></i> vaigau2105@gmail.com</li>
            <li><i class="fas fa-phone mr-2 text-brand-pink-light"></i> +91 90349 10627</li>
            <li class="pt-2">
              <a href="https://wa.me/919034910627" class="inline-flex items-center text-brand-pink-light hover:text-white transition-colors">
                <i class="fab fa-whatsapp mr-2 text-lg"></i> Chat on WhatsApp
              </a>
            </li>
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
  </footer>

  <!-- Cart Drawer -->
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
          <button onclick="window.location.href='/checkout'" class="w-full py-3 bg-brand-pink text-white rounded-full font-medium hover:bg-brand-pink-hover transition-colors">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Cart state
    let cart = JSON.parse(localStorage.getItem('lp_cart') || '[]');
    let wishlist = JSON.parse(localStorage.getItem('lp_wishlist') || '[]');

    function updateCartUI() {
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      const countEl = document.getElementById('cart-count');
      if (count > 0) { countEl.textContent = count; countEl.classList.remove('hidden'); }
      else { countEl.classList.add('hidden'); }
      
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      document.getElementById('cart-total').textContent = '₹' + total.toLocaleString('en-IN');
      
      const itemsEl = document.getElementById('cart-items');
      if (cart.length === 0) {
        itemsEl.innerHTML = '<p class="text-center text-brand-maroon/50 py-12">Your bag is empty</p>';
      } else {
        itemsEl.innerHTML = cart.map((item, i) => \`
          <div class="flex gap-4 mb-4 pb-4 border-b border-brand-pink-soft">
            <img src="\${item.image}" alt="\${item.name}" class="w-16 h-16 object-cover rounded-lg">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-brand-maroon">\${item.name}</h4>
              <p class="text-brand-pink font-semibold text-sm">₹\${item.price.toLocaleString('en-IN')}</p>
              <div class="flex items-center gap-2 mt-1">
                <button onclick="updateQty(\${i}, -1)" class="w-6 h-6 rounded-full bg-brand-pink-soft text-brand-maroon text-xs flex items-center justify-center">-</button>
                <span class="text-xs">\${item.quantity}</span>
                <button onclick="updateQty(\${i}, 1)" class="w-6 h-6 rounded-full bg-brand-pink-soft text-brand-maroon text-xs flex items-center justify-center">+</button>
                <button onclick="removeFromCart(\${i})" class="ml-auto text-red-400 text-xs"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        \`).join('');
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

    function toggleCart() {
      document.getElementById('cart-drawer').classList.toggle('hidden');
    }

    function toggleSearch() {
      document.getElementById('search-bar').classList.toggle('hidden');
      document.getElementById('search-input')?.focus();
    }

    function toggleMobileMenu() {
      document.getElementById('mobile-menu').classList.toggle('hidden');
    }

    function toggleWishlist(productId) {
      const idx = wishlist.indexOf(productId);
      if (idx >= 0) wishlist.splice(idx, 1);
      else wishlist.push(productId);
      localStorage.setItem('lp_wishlist', JSON.stringify(wishlist));
      updateWishlistUI();
    }

    function updateWishlistUI() {
      const countEl = document.getElementById('wishlist-count');
      if (wishlist.length > 0) { countEl.textContent = wishlist.length; countEl.classList.remove('hidden'); }
      else { countEl.classList.add('hidden'); }
    }

    // Product card template
    function productCard(p) {
      const isWished = wishlist.includes(p.id);
      return \`
        <div class="card-hover bg-white rounded-2xl overflow-hidden border border-brand-pink-soft/50 shadow-sm">
          <div class="relative group">
            <a href="/product/\${p.slug}">
              <img src="\${p.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400'}" alt="\${p.name}" class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500">
            </a>
            <button onclick="toggleWishlist(\${p.id})" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-brand-pink hover:text-white transition-all \${isWished ? 'text-brand-pink' : 'text-brand-maroon/40'}">
              <i class="fas fa-heart text-sm"></i>
            </button>
            \${p.is_new_arrival ? '<span class="absolute top-3 left-3 bg-brand-gold text-white text-xs px-2 py-1 rounded-full font-medium">New</span>' : ''}
            \${p.compare_price ? '<span class="absolute bottom-3 left-3 bg-brand-pink text-white text-xs px-2 py-1 rounded-full font-medium">' + Math.round((1 - p.price/p.compare_price)*100) + '% OFF</span>' : ''}
          </div>
          <div class="p-4">
            <p class="text-xs text-brand-gold uppercase tracking-wider mb-1">\${p.category_name || ''}</p>
            <a href="/product/\${p.slug}" class="block">
              <h3 class="font-serif text-lg font-semibold text-brand-maroon hover:text-brand-pink transition-colors mb-2">\${p.name}</h3>
            </a>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-brand-pink font-bold">₹\${p.price.toLocaleString('en-IN')}</span>
                \${p.compare_price ? '<span class="text-brand-maroon/40 text-sm line-through ml-2">₹' + p.compare_price.toLocaleString('en-IN') + '</span>' : ''}
              </div>
              <button onclick='addToCart(\${JSON.stringify({id: p.id, name: p.name, price: p.price, image: p.image_url, slug: p.slug})})' class="w-9 h-9 rounded-full bg-brand-pink-soft text-brand-pink flex items-center justify-center hover:bg-brand-pink hover:text-white transition-all">
                <i class="fas fa-plus text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      \`;
    }

    // Load data
    async function loadHomepage() {
      try {
        // Categories
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        const catIcons = ['fa-gem', 'fa-ring', 'fa-crown', 'fa-necklace', 'fa-gift', 'fa-heart', 'fa-building', 'fa-star'];
        const catColors = ['from-pink-100 to-rose-50', 'from-amber-50 to-yellow-50', 'from-purple-50 to-pink-50', 'from-blue-50 to-indigo-50', 'from-rose-50 to-pink-50', 'from-red-50 to-rose-50', 'from-slate-50 to-gray-50', 'from-orange-50 to-amber-50'];
        document.getElementById('categories-grid').innerHTML = catData.categories.slice(0, 8).map((cat, i) => \`
          <a href="/shop?category=\${cat.slug}" class="card-hover block bg-gradient-to-br \${catColors[i] || catColors[0]} rounded-2xl p-6 text-center border border-brand-pink-soft/30">
            <div class="w-12 h-12 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-sm">
              <i class="fas \${catIcons[i] || 'fa-gem'} text-brand-pink text-lg"></i>
            </div>
            <h3 class="font-serif text-lg font-semibold text-brand-maroon">\${cat.name}</h3>
            <p class="text-xs text-brand-maroon/50 mt-1">\${cat.description || 'Explore'}</p>
          </a>
        \`).join('');

        // Featured products
        const featRes = await fetch('/api/products?featured=1&limit=4');
        const featData = await featRes.json();
        document.getElementById('featured-products').innerHTML = featData.products.map(p => productCard(p)).join('');

        // Best sellers
        const bestRes = await fetch('/api/products?best_sellers=1&limit=4');
        const bestData = await bestRes.json();
        document.getElementById('best-sellers').innerHTML = bestData.products.map(p => productCard(p)).join('');

      } catch (err) { console.error('Error loading homepage:', err); }
    }

    // Initialize
    updateCartUI();
    updateWishlistUI();
    loadHomepage();

    // Search functionality
    document.getElementById('search-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') window.location.href = '/shop?search=' + e.target.value;
    });
  </script>
</body>
</html>`)
})

// Shop page
app.get('/shop', (c) => {
  return c.html(`${htmlHead('Shop')}
<body class="bg-brand-ivory min-h-screen">
  <!-- Same nav as homepage (abbreviated for clarity, loaded via JS) -->
  <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-pink-soft shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        <a href="/" class="flex items-center gap-3">
          <img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 md:h-14 w-auto">
        </a>
        <div class="hidden md:flex items-center gap-8">
          <a href="/" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink">Home</a>
          <a href="/shop" class="nav-link text-brand-pink font-medium text-sm tracking-wide">Shop</a>
          <a href="/collections" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink">Collections</a>
          <a href="/build-hamper" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink">Build Hamper</a>
          <a href="/about" class="nav-link text-brand-maroon font-medium text-sm tracking-wide hover:text-brand-pink">About</a>
        </div>
        <div class="flex items-center gap-4">
          <button onclick="toggleCart()" class="text-brand-maroon hover:text-brand-pink relative">
            <i class="fas fa-shopping-bag text-lg"></i>
            <span id="cart-count" class="absolute -top-2 -right-2 bg-brand-pink text-white text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb -->
    <nav class="mb-6 text-sm text-brand-maroon/60">
      <a href="/" class="hover:text-brand-pink">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i> <span class="text-brand-maroon">Shop</span>
    </nav>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Filters Sidebar -->
      <aside class="lg:w-64 flex-shrink-0">
        <div class="bg-white rounded-2xl p-6 border border-brand-pink-soft/50 shadow-sm sticky top-24">
          <h3 class="font-serif text-xl font-bold text-brand-maroon mb-4">Filters</h3>
          
          <div class="mb-6">
            <h4 class="font-medium text-brand-maroon text-sm mb-3">Category</h4>
            <div id="filter-categories" class="space-y-2">
              <!-- Loaded dynamically -->
            </div>
          </div>

          <div class="mb-6">
            <h4 class="font-medium text-brand-maroon text-sm mb-3">Price Range</h4>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer">
                <input type="radio" name="price" value="" onchange="applyFilters()" checked class="accent-brand-pink"> All
              </label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer">
                <input type="radio" name="price" value="0-999" onchange="applyFilters()" class="accent-brand-pink"> Under ₹999
              </label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer">
                <input type="radio" name="price" value="1000-2499" onchange="applyFilters()" class="accent-brand-pink"> ₹1,000 - ₹2,499
              </label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer">
                <input type="radio" name="price" value="2500-4999" onchange="applyFilters()" class="accent-brand-pink"> ₹2,500 - ₹4,999
              </label>
              <label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer">
                <input type="radio" name="price" value="5000-" onchange="applyFilters()" class="accent-brand-pink"> Above ₹5,000
              </label>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-brand-maroon text-sm mb-3">Sort By</h4>
            <select id="sort-select" onchange="applyFilters()" class="w-full p-2 rounded-lg border border-brand-pink-light text-sm text-brand-maroon focus:border-brand-pink outline-none">
              <option value="newest">Newest First</option>
              <option value="popular">Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </aside>

      <!-- Products Grid -->
      <div class="flex-1">
        <div class="flex items-center justify-between mb-6">
          <h1 class="font-serif text-3xl font-bold text-brand-maroon" id="shop-title">All Products</h1>
          <p class="text-sm text-brand-maroon/60" id="product-count">Loading...</p>
        </div>
        <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Loaded dynamically -->
        </div>
      </div>
    </div>
  </main>

  <!-- Cart Drawer (same as homepage) -->
  <div id="cart-drawer" class="fixed inset-0 z-[100] hidden">
    <div class="absolute inset-0 bg-black/50" onclick="toggleCart()"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between p-6 border-b border-brand-pink-soft">
          <h3 class="font-serif text-2xl font-bold text-brand-maroon">Your Bag</h3>
          <button onclick="toggleCart()" class="text-brand-maroon hover:text-brand-pink"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div id="cart-items" class="flex-1 overflow-y-auto p-6"><p class="text-center text-brand-maroon/50 py-12">Your bag is empty</p></div>
        <div class="border-t border-brand-pink-soft p-6">
          <div class="flex justify-between mb-4"><span class="font-medium text-brand-maroon">Subtotal</span><span id="cart-total" class="font-semibold text-brand-maroon">₹0</span></div>
          <button class="w-full py-3 bg-brand-pink text-white rounded-full font-medium hover:bg-brand-pink-hover transition-colors">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let cart = JSON.parse(localStorage.getItem('lp_cart') || '[]');
    let wishlist = JSON.parse(localStorage.getItem('lp_wishlist') || '[]');
    let currentCategory = new URLSearchParams(window.location.search).get('category') || '';
    let currentSearch = new URLSearchParams(window.location.search).get('search') || '';

    function updateCartUI() {
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      const countEl = document.getElementById('cart-count');
      if (count > 0) { countEl.textContent = count; countEl.classList.remove('hidden'); }
      else { countEl.classList.add('hidden'); }
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      document.getElementById('cart-total').textContent = '₹' + total.toLocaleString('en-IN');
      const itemsEl = document.getElementById('cart-items');
      if (cart.length === 0) { itemsEl.innerHTML = '<p class="text-center text-brand-maroon/50 py-12">Your bag is empty</p>'; }
      else { itemsEl.innerHTML = cart.map((item, i) => '<div class="flex gap-4 mb-4 pb-4 border-b border-brand-pink-soft"><img src="'+item.image+'" class="w-16 h-16 object-cover rounded-lg"><div class="flex-1"><h4 class="text-sm font-medium text-brand-maroon">'+item.name+'</h4><p class="text-brand-pink font-semibold text-sm">₹'+item.price.toLocaleString('en-IN')+'</p><span class="text-xs text-brand-maroon/50">Qty: '+item.quantity+'</span></div><button onclick="removeFromCart('+i+')" class="text-red-400 text-xs self-start"><i class="fas fa-trash"></i></button></div>').join(''); }
    }

    function addToCart(product) {
      const existing = cart.findIndex(item => item.id === product.id);
      if (existing >= 0) { cart[existing].quantity++; } else { cart.push({ ...product, quantity: 1 }); }
      localStorage.setItem('lp_cart', JSON.stringify(cart));
      updateCartUI(); toggleCart();
    }
    function removeFromCart(index) { cart.splice(index, 1); localStorage.setItem('lp_cart', JSON.stringify(cart)); updateCartUI(); }
    function toggleCart() { document.getElementById('cart-drawer').classList.toggle('hidden'); }
    function toggleWishlist(id) { const idx = wishlist.indexOf(id); if (idx >= 0) wishlist.splice(idx, 1); else wishlist.push(id); localStorage.setItem('lp_wishlist', JSON.stringify(wishlist)); loadProducts(); }

    function productCard(p) {
      const isWished = wishlist.includes(p.id);
      return '<div class="card-hover bg-white rounded-2xl overflow-hidden border border-brand-pink-soft/50 shadow-sm"><div class="relative group"><a href="/product/'+p.slug+'"><img src="'+(p.image_url||'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400')+'" alt="'+p.name+'" class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"></a><button onclick="toggleWishlist('+p.id+')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-brand-pink hover:text-white transition-all '+(isWished?'text-brand-pink':'text-brand-maroon/40')+'"><i class="fas fa-heart text-sm"></i></button>'+(p.is_new_arrival?'<span class="absolute top-3 left-3 bg-brand-gold text-white text-xs px-2 py-1 rounded-full font-medium">New</span>':'')+'</div><div class="p-4"><p class="text-xs text-brand-gold uppercase tracking-wider mb-1">'+(p.category_name||'')+'</p><a href="/product/'+p.slug+'"><h3 class="font-serif text-lg font-semibold text-brand-maroon hover:text-brand-pink transition-colors mb-2">'+p.name+'</h3></a><div class="flex items-center justify-between"><div><span class="text-brand-pink font-bold">₹'+p.price.toLocaleString('en-IN')+'</span>'+(p.compare_price?'<span class="text-brand-maroon/40 text-sm line-through ml-2">₹'+p.compare_price.toLocaleString('en-IN')+'</span>':'')+'</div><button onclick=\\'addToCart('+JSON.stringify({id:p.id,name:p.name,price:p.price,image:p.image_url,slug:p.slug})+')\\'  class="w-9 h-9 rounded-full bg-brand-pink-soft text-brand-pink flex items-center justify-center hover:bg-brand-pink hover:text-white transition-all"><i class="fas fa-plus text-sm"></i></button></div></div></div>';
    }

    async function loadProducts() {
      const sort = document.getElementById('sort-select').value;
      const priceRadio = document.querySelector('input[name="price"]:checked')?.value || '';
      let url = '/api/products?sort=' + sort + '&limit=20';
      if (currentCategory) url += '&category=' + currentCategory;
      if (currentSearch) url += '&search=' + currentSearch;
      if (priceRadio) {
        const [min, max] = priceRadio.split('-');
        if (min) url += '&min_price=' + min;
        if (max) url += '&max_price=' + max;
      }
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById('products-grid').innerHTML = data.products.map(p => productCard(p)).join('');
      document.getElementById('product-count').textContent = data.total + ' products';
      if (currentCategory) document.getElementById('shop-title').textContent = currentCategory.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
      if (currentSearch) document.getElementById('shop-title').textContent = 'Search: "' + currentSearch + '"';
    }

    async function loadFilters() {
      const res = await fetch('/api/categories');
      const data = await res.json();
      document.getElementById('filter-categories').innerHTML = '<label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="category" value="" onchange="currentCategory=\\'\\';applyFilters()" '+(currentCategory?'':'checked')+' class="accent-brand-pink"> All</label>' + data.categories.map(cat => '<label class="flex items-center gap-2 text-sm text-brand-maroon/70 cursor-pointer"><input type="radio" name="category" value="'+cat.slug+'" onchange="currentCategory=\\''+cat.slug+'\\';applyFilters()" '+(currentCategory===cat.slug?'checked':'')+' class="accent-brand-pink"> '+cat.name+'</label>').join('');
    }

    function applyFilters() { loadProducts(); }
    updateCartUI(); loadFilters(); loadProducts();
  </script>
</body>
</html>`)
})

// Product detail page
app.get('/product/:slug', (c) => {
  return c.html(`${htmlHead('Product Detail')}
<body class="bg-brand-ivory min-h-screen">
  <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-pink-soft shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        <a href="/" class="flex items-center gap-3"><img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 md:h-14 w-auto"></a>
        <div class="hidden md:flex items-center gap-8">
          <a href="/" class="nav-link text-brand-maroon font-medium text-sm">Home</a>
          <a href="/shop" class="nav-link text-brand-maroon font-medium text-sm">Shop</a>
          <a href="/build-hamper" class="nav-link text-brand-maroon font-medium text-sm">Build Hamper</a>
        </div>
        <div class="flex items-center gap-4">
          <button onclick="toggleCart()" class="text-brand-maroon hover:text-brand-pink relative">
            <i class="fas fa-shopping-bag text-lg"></i>
            <span id="cart-count" class="absolute -top-2 -right-2 bg-brand-pink text-white text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="product-detail">
    <div class="text-center py-20"><div class="animate-spin w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full mx-auto"></div></div>
  </main>

  <div id="cart-drawer" class="fixed inset-0 z-[100] hidden">
    <div class="absolute inset-0 bg-black/50" onclick="toggleCart()"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between p-6 border-b border-brand-pink-soft"><h3 class="font-serif text-2xl font-bold text-brand-maroon">Your Bag</h3><button onclick="toggleCart()" class="text-brand-maroon"><i class="fas fa-times text-xl"></i></button></div>
        <div id="cart-items" class="flex-1 overflow-y-auto p-6"><p class="text-center text-brand-maroon/50 py-12">Your bag is empty</p></div>
        <div class="border-t border-brand-pink-soft p-6"><div class="flex justify-between mb-4"><span>Subtotal</span><span id="cart-total" class="font-semibold">₹0</span></div><button class="w-full py-3 bg-brand-pink text-white rounded-full font-medium">Checkout</button></div>
      </div>
    </div>
  </div>

  <script>
    let cart = JSON.parse(localStorage.getItem('lp_cart') || '[]');
    function updateCartUI() {
      const count = cart.reduce((s,i)=>s+i.quantity,0);
      const el = document.getElementById('cart-count');
      if(count>0){el.textContent=count;el.classList.remove('hidden')}else{el.classList.add('hidden')}
      document.getElementById('cart-total').textContent='₹'+cart.reduce((s,i)=>s+i.price*i.quantity,0).toLocaleString('en-IN');
    }
    function addToCart(product) {
      const ex = cart.findIndex(i=>i.id===product.id);
      if(ex>=0)cart[ex].quantity++;else cart.push({...product,quantity:1});
      localStorage.setItem('lp_cart',JSON.stringify(cart));updateCartUI();toggleCart();
    }
    function toggleCart(){document.getElementById('cart-drawer').classList.toggle('hidden')}

    async function loadProduct() {
      const slug = window.location.pathname.split('/product/')[1];
      const res = await fetch('/api/products/' + slug);
      if (!res.ok) { document.getElementById('product-detail').innerHTML = '<p class="text-center py-20 text-brand-maroon/60">Product not found</p>'; return; }
      const { product: p } = await res.json();
      
      document.title = p.name + ' | Little Potli';
      document.getElementById('product-detail').innerHTML = \`
        <nav class="mb-6 text-sm text-brand-maroon/60">
          <a href="/" class="hover:text-brand-pink">Home</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
          <a href="/shop" class="hover:text-brand-pink">Shop</a> <i class="fas fa-chevron-right text-xs mx-2"></i>
          <span class="text-brand-maroon">\${p.name}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div class="space-y-4">
            <div class="bg-white rounded-2xl overflow-hidden border border-brand-pink-soft/50 shadow-sm">
              <img src="\${p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'}" alt="\${p.name}" class="w-full h-[500px] object-cover" id="main-image">
            </div>
            \${p.images?.length > 1 ? '<div class="flex gap-2 overflow-x-auto pb-2">' + p.images.map((img, i) => '<img src="'+img.image_url+'" onclick="document.getElementById(\\'main-image\\').src=\\''+img.image_url+'\\'" class="w-20 h-20 rounded-lg object-cover cursor-pointer border-2 border-transparent hover:border-brand-pink transition-colors">').join('') + '</div>' : ''}
          </div>

          <div class="space-y-6">
            <div>
              <p class="text-brand-gold text-sm uppercase tracking-wider mb-1">\${p.category_name || ''}</p>
              <h1 class="font-serif text-3xl md:text-4xl font-bold text-brand-maroon mb-2">\${p.name}</h1>
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-brand-pink">₹\${p.price.toLocaleString('en-IN')}</span>
                \${p.compare_price ? '<span class="text-lg text-brand-maroon/40 line-through">₹'+p.compare_price.toLocaleString('en-IN')+'</span><span class="bg-brand-pink-soft text-brand-pink text-xs px-2 py-1 rounded-full font-medium">'+Math.round((1-p.price/p.compare_price)*100)+'% OFF</span>' : ''}
              </div>
            </div>

            <div class="border-t border-brand-pink-soft pt-4">
              <p class="text-brand-maroon/70 leading-relaxed">\${p.description || p.short_description || ''}</p>
            </div>

            \${p.material ? '<div class="flex items-start gap-3"><i class="fas fa-gem text-brand-gold mt-1"></i><div><h4 class="font-medium text-brand-maroon text-sm">Material</h4><p class="text-sm text-brand-maroon/60">'+p.material+'</p></div></div>' : ''}
            \${p.care_instructions ? '<div class="flex items-start gap-3"><i class="fas fa-hand-sparkles text-brand-gold mt-1"></i><div><h4 class="font-medium text-brand-maroon text-sm">Care Instructions</h4><p class="text-sm text-brand-maroon/60">'+p.care_instructions+'</p></div></div>' : ''}

            <div class="flex items-center gap-3 text-sm">
              <span class="\${p.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}">
                <i class="fas \${p.stock_quantity > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                \${p.stock_quantity > 0 ? 'In Stock ('+p.stock_quantity+' available)' : 'Out of Stock'}
              </span>
            </div>

            <div class="flex gap-3 pt-4">
              <button onclick='addToCart(\${JSON.stringify({id:p.id,name:p.name,price:p.price,image:p.images?.[0]?.image_url,slug:p.slug})})' class="flex-1 py-3 bg-brand-pink text-white rounded-full font-medium hover:bg-brand-pink-hover transition-all shadow-lg shadow-brand-pink/30 flex items-center justify-center gap-2 \${p.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}" \${p.stock_quantity <= 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-bag"></i> Add to Bag
              </button>
              <a href="https://wa.me/919034910627?text=Hi! I'm interested in \${encodeURIComponent(p.name)}" target="_blank" class="px-6 py-3 border-2 border-brand-gold text-brand-maroon rounded-full font-medium hover:bg-brand-gold hover:text-white transition-all flex items-center gap-2">
                <i class="fab fa-whatsapp"></i> Enquire
              </a>
            </div>

            \${p.tags?.length ? '<div class="pt-4 border-t border-brand-pink-soft"><p class="text-xs text-brand-maroon/50 mb-2">Tags:</p><div class="flex flex-wrap gap-2">'+p.tags.map(t=>'<span class="text-xs bg-brand-pink-soft text-brand-maroon px-2 py-1 rounded-full">'+t+'</span>').join('')+'</div></div>' : ''}
          </div>
        </div>
      \`;
    }

    updateCartUI(); loadProduct();
  </script>
</body>
</html>`)
})

// Build Hamper page
app.get('/build-hamper', (c) => {
  return c.html(`${htmlHead('Build Your Hamper')}
<body class="bg-brand-ivory min-h-screen">
  <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-pink-soft shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        <a href="/" class="flex items-center"><img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 md:h-14 w-auto"></a>
        <div class="hidden md:flex items-center gap-8">
          <a href="/" class="nav-link text-brand-maroon font-medium text-sm">Home</a>
          <a href="/shop" class="nav-link text-brand-maroon font-medium text-sm">Shop</a>
          <a href="/build-hamper" class="nav-link text-brand-pink font-medium text-sm">Build Hamper</a>
        </div>
        <button onclick="toggleCart()" class="text-brand-maroon hover:text-brand-pink relative">
          <i class="fas fa-shopping-bag text-lg"></i>
          <span id="cart-count" class="absolute -top-2 -right-2 bg-brand-pink text-white text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
        </button>
      </div>
    </div>
  </nav>

  <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="text-center mb-10">
      <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Create Something Special</p>
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-brand-maroon mb-3">Build Your Dream Hamper</h1>
      <p class="text-brand-maroon/60 max-w-lg mx-auto">Follow the steps below to create a personalized gift hamper that will make someone's day truly special.</p>
    </div>

    <!-- Progress Steps -->
    <div class="flex items-center justify-center gap-2 mb-10">
      <div class="step-indicator flex items-center gap-1" data-step="1">
        <div class="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-medium">1</div>
        <span class="hidden sm:inline text-xs text-brand-maroon font-medium">Box</span>
      </div>
      <div class="w-8 h-px bg-brand-pink-light"></div>
      <div class="step-indicator flex items-center gap-1" data-step="2">
        <div class="w-8 h-8 rounded-full bg-brand-pink-soft text-brand-maroon flex items-center justify-center text-sm font-medium">2</div>
        <span class="hidden sm:inline text-xs text-brand-maroon/60 font-medium">Items</span>
      </div>
      <div class="w-8 h-px bg-brand-pink-light"></div>
      <div class="step-indicator flex items-center gap-1" data-step="3">
        <div class="w-8 h-8 rounded-full bg-brand-pink-soft text-brand-maroon flex items-center justify-center text-sm font-medium">3</div>
        <span class="hidden sm:inline text-xs text-brand-maroon/60 font-medium">Packaging</span>
      </div>
      <div class="w-8 h-px bg-brand-pink-light"></div>
      <div class="step-indicator flex items-center gap-1" data-step="4">
        <div class="w-8 h-8 rounded-full bg-brand-pink-soft text-brand-maroon flex items-center justify-center text-sm font-medium">4</div>
        <span class="hidden sm:inline text-xs text-brand-maroon/60 font-medium">Message</span>
      </div>
      <div class="w-8 h-px bg-brand-pink-light"></div>
      <div class="step-indicator flex items-center gap-1" data-step="5">
        <div class="w-8 h-8 rounded-full bg-brand-pink-soft text-brand-maroon flex items-center justify-center text-sm font-medium">5</div>
        <span class="hidden sm:inline text-xs text-brand-maroon/60 font-medium">Review</span>
      </div>
    </div>

    <!-- Step Content -->
    <div id="hamper-steps" class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6 md:p-8">
      <!-- Step 1: Box Selection -->
      <div id="step-1" class="step-content">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">Choose Your Gift Box</h2>
        <div id="box-options" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="text-center py-8"><div class="animate-spin w-6 h-6 border-2 border-brand-pink border-t-transparent rounded-full mx-auto"></div></div>
        </div>
      </div>

      <!-- Step 2: Items -->
      <div id="step-2" class="step-content hidden">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-2">Select Your Accessories</h2>
        <p class="text-sm text-brand-maroon/60 mb-6">Pick items to fill your hamper (max <span id="max-items">5</span> items)</p>
        <div id="item-options" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>

      <!-- Step 3: Packaging -->
      <div id="step-3" class="step-content hidden">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">Add Packaging Extras</h2>
        <div id="packaging-options" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
      </div>

      <!-- Step 4: Message -->
      <div id="step-4" class="step-content hidden">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">Add a Personal Message</h2>
        <div class="max-w-lg">
          <textarea id="gift-message" rows="4" placeholder="Write your heartfelt message here..." class="w-full p-4 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-brand-maroon resize-none"></textarea>
          <p class="text-xs text-brand-maroon/40 mt-2">This message will be printed on a beautiful gift card</p>
        </div>
      </div>

      <!-- Step 5: Review -->
      <div id="step-5" class="step-content hidden">
        <h2 class="font-serif text-2xl font-bold text-brand-maroon mb-6">Review Your Hamper</h2>
        <div id="hamper-summary"></div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-8 pt-6 border-t border-brand-pink-soft">
        <button id="prev-btn" onclick="prevStep()" class="px-6 py-2 border border-brand-pink-light text-brand-maroon rounded-full text-sm font-medium hover:bg-brand-pink-soft transition-colors hidden">
          <i class="fas fa-arrow-left mr-1"></i> Back
        </button>
        <button id="next-btn" onclick="nextStep()" class="ml-auto px-6 py-2 bg-brand-pink text-white rounded-full text-sm font-medium hover:bg-brand-pink-hover transition-colors">
          Next <i class="fas fa-arrow-right ml-1"></i>
        </button>
      </div>
    </div>

    <!-- Price Summary Sidebar -->
    <div class="mt-6 bg-white rounded-2xl border border-brand-pink-soft/50 shadow-sm p-6">
      <h3 class="font-serif text-xl font-bold text-brand-maroon mb-4">Price Breakdown</h3>
      <div id="price-breakdown" class="space-y-2 text-sm">
        <div class="flex justify-between text-brand-maroon/70"><span>Box</span><span id="price-box">₹0</span></div>
        <div class="flex justify-between text-brand-maroon/70"><span>Items</span><span id="price-items">₹0</span></div>
        <div class="flex justify-between text-brand-maroon/70"><span>Packaging</span><span id="price-packaging">₹0</span></div>
        <div class="border-t border-brand-pink-soft pt-2 mt-2 flex justify-between font-semibold text-brand-maroon"><span>Total</span><span id="price-total">₹0</span></div>
      </div>
    </div>
  </main>

  <div id="cart-drawer" class="fixed inset-0 z-[100] hidden">
    <div class="absolute inset-0 bg-black/50" onclick="toggleCart()"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between p-6 border-b"><h3 class="font-serif text-2xl font-bold text-brand-maroon">Your Bag</h3><button onclick="toggleCart()"><i class="fas fa-times text-xl"></i></button></div>
        <div id="cart-items" class="flex-1 overflow-y-auto p-6"><p class="text-center text-brand-maroon/50 py-12">Your bag is empty</p></div>
        <div class="border-t p-6"><div class="flex justify-between mb-4"><span>Subtotal</span><span id="cart-total">₹0</span></div><button class="w-full py-3 bg-brand-pink text-white rounded-full">Checkout</button></div>
      </div>
    </div>
  </div>

  <script>
    let cart = JSON.parse(localStorage.getItem('lp_cart') || '[]');
    let currentStep = 1;
    let hamper = { box: null, items: [], packaging: [], message: '' };

    function updateCartUI() { const c=cart.reduce((s,i)=>s+i.quantity,0);const el=document.getElementById('cart-count');if(c>0){el.textContent=c;el.classList.remove('hidden')}else{el.classList.add('hidden')} }
    function toggleCart(){document.getElementById('cart-drawer').classList.toggle('hidden')}
    
    function updatePrices() {
      const boxPrice = hamper.box?.price || 0;
      const itemsPrice = hamper.items.reduce((s, i) => s + i.price, 0);
      const packPrice = hamper.packaging.reduce((s, p) => s + p.price, 0);
      document.getElementById('price-box').textContent = '₹' + boxPrice.toLocaleString('en-IN');
      document.getElementById('price-items').textContent = '₹' + itemsPrice.toLocaleString('en-IN');
      document.getElementById('price-packaging').textContent = '₹' + packPrice.toLocaleString('en-IN');
      document.getElementById('price-total').textContent = '₹' + (boxPrice + itemsPrice + packPrice).toLocaleString('en-IN');
    }

    function showStep(step) {
      document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
      document.getElementById('step-' + step).classList.remove('hidden');
      document.getElementById('prev-btn').classList.toggle('hidden', step === 1);
      document.getElementById('next-btn').textContent = step === 5 ? 'Add to Bag' : 'Next';
      document.getElementById('next-btn').innerHTML = step === 5 ? '<i class="fas fa-shopping-bag mr-1"></i> Add to Bag' : 'Next <i class="fas fa-arrow-right ml-1"></i>';

      // Update step indicators
      document.querySelectorAll('.step-indicator').forEach(el => {
        const s = parseInt(el.dataset.step);
        const circle = el.querySelector('div');
        const text = el.querySelector('span');
        if (s <= step) { circle.className = 'w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-medium'; if(text)text.className='hidden sm:inline text-xs text-brand-maroon font-medium'; }
        else { circle.className = 'w-8 h-8 rounded-full bg-brand-pink-soft text-brand-maroon flex items-center justify-center text-sm font-medium'; if(text)text.className='hidden sm:inline text-xs text-brand-maroon/60 font-medium'; }
      });
    }

    function nextStep() {
      if (currentStep === 1 && !hamper.box) { alert('Please select a box'); return; }
      if (currentStep === 2 && hamper.items.length === 0) { alert('Please select at least one item'); return; }
      if (currentStep === 4) { hamper.message = document.getElementById('gift-message').value; showSummary(); }
      if (currentStep === 5) { addHamperToCart(); return; }
      if (currentStep < 5) { currentStep++; showStep(currentStep); }
    }

    function prevStep() { if (currentStep > 1) { currentStep--; showStep(currentStep); } }

    function selectBox(box) {
      hamper.box = box;
      document.getElementById('max-items').textContent = box.max_items;
      document.querySelectorAll('.box-option').forEach(el => el.classList.remove('ring-2', 'ring-brand-pink'));
      document.querySelector('[data-box-id="'+box.id+'"]').classList.add('ring-2', 'ring-brand-pink');
      updatePrices();
    }

    function toggleItem(product) {
      const idx = hamper.items.findIndex(i => i.id === product.id);
      if (idx >= 0) { hamper.items.splice(idx, 1); }
      else {
        if (hamper.box && hamper.items.length >= hamper.box.max_items) { alert('Maximum ' + hamper.box.max_items + ' items allowed for this box'); return; }
        hamper.items.push(product);
      }
      renderItems();
      updatePrices();
    }

    function togglePackaging(pkg) {
      const idx = hamper.packaging.findIndex(p => p.id === pkg.id);
      if (idx >= 0) hamper.packaging.splice(idx, 1);
      else hamper.packaging.push(pkg);
      renderPackaging();
      updatePrices();
    }

    function renderItems() {
      document.querySelectorAll('.item-option').forEach(el => {
        const id = parseInt(el.dataset.itemId);
        const selected = hamper.items.some(i => i.id === id);
        el.classList.toggle('ring-2', selected);
        el.classList.toggle('ring-brand-pink', selected);
        el.querySelector('.check-icon')?.classList.toggle('hidden', !selected);
      });
    }

    function renderPackaging() {
      document.querySelectorAll('.pkg-option').forEach(el => {
        const id = parseInt(el.dataset.pkgId);
        const selected = hamper.packaging.some(p => p.id === id);
        el.classList.toggle('ring-2', selected);
        el.classList.toggle('ring-brand-pink', selected);
      });
    }

    function showSummary() {
      const total = (hamper.box?.price||0) + hamper.items.reduce((s,i)=>s+i.price,0) + hamper.packaging.reduce((s,p)=>s+p.price,0);
      document.getElementById('hamper-summary').innerHTML = \`
        <div class="space-y-4">
          <div class="p-4 bg-brand-pink-soft/30 rounded-xl"><h4 class="font-medium text-brand-maroon mb-1">Gift Box</h4><p class="text-sm text-brand-maroon/70">\${hamper.box?.name} - ₹\${hamper.box?.price?.toLocaleString('en-IN')}</p></div>
          <div class="p-4 bg-brand-pink-soft/30 rounded-xl"><h4 class="font-medium text-brand-maroon mb-1">Items (\${hamper.items.length})</h4>\${hamper.items.map(i=>'<p class="text-sm text-brand-maroon/70">'+i.name+' - ₹'+i.price.toLocaleString('en-IN')+'</p>').join('')}</div>
          \${hamper.packaging.length ? '<div class="p-4 bg-brand-pink-soft/30 rounded-xl"><h4 class="font-medium text-brand-maroon mb-1">Packaging</h4>'+hamper.packaging.map(p=>'<p class="text-sm text-brand-maroon/70">'+p.name+' - ₹'+p.price.toLocaleString('en-IN')+'</p>').join('')+'</div>' : ''}
          \${hamper.message ? '<div class="p-4 bg-brand-pink-soft/30 rounded-xl"><h4 class="font-medium text-brand-maroon mb-1">Gift Message</h4><p class="text-sm text-brand-maroon/70 italic">"'+hamper.message+'"</p></div>' : ''}
          <div class="p-4 bg-brand-gold/10 rounded-xl border border-brand-gold/30"><div class="flex justify-between font-semibold text-brand-maroon"><span>Total Hamper Price</span><span>₹\${total.toLocaleString('en-IN')}</span></div></div>
        </div>
      \`;
    }

    function addHamperToCart() {
      const total = (hamper.box?.price||0) + hamper.items.reduce((s,i)=>s+i.price,0) + hamper.packaging.reduce((s,p)=>s+p.price,0);
      cart.push({ id: 'hamper-'+Date.now(), name: 'Custom Hamper ('+hamper.box?.name+')', price: total, quantity: 1, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400', type: 'hamper' });
      localStorage.setItem('lp_cart', JSON.stringify(cart));
      updateCartUI();
      alert('Your custom hamper has been added to the bag!');
      window.location.href = '/shop';
    }

    // Load data
    async function loadHamperData() {
      // Load boxes
      const boxRes = await fetch('/api/hamper-boxes');
      const boxData = await boxRes.json();
      document.getElementById('box-options').innerHTML = boxData.boxes.map(box => \`
        <div class="box-option cursor-pointer p-6 rounded-xl border border-brand-pink-soft hover:border-brand-pink transition-all" data-box-id="\${box.id}" onclick='selectBox(\${JSON.stringify(box)})'>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-brand-pink-soft rounded-full flex items-center justify-center"><i class="fas fa-box-open text-brand-pink"></i></div>
            <div><h3 class="font-serif text-lg font-semibold text-brand-maroon">\${box.name}</h3><span class="text-xs text-brand-gold uppercase">\${box.tier}</span></div>
          </div>
          <p class="text-sm text-brand-maroon/60 mb-2">\${box.description || ''}</p>
          <div class="flex justify-between items-center"><span class="text-brand-pink font-bold">₹\${box.price.toLocaleString('en-IN')}</span><span class="text-xs text-brand-maroon/50">Fits \${box.max_items} items</span></div>
        </div>
      \`).join('');

      // Load products for items
      const prodRes = await fetch('/api/products?limit=50');
      const prodData = await prodRes.json();
      document.getElementById('item-options').innerHTML = prodData.products.map(p => \`
        <div class="item-option cursor-pointer p-4 rounded-xl border border-brand-pink-soft hover:border-brand-pink transition-all relative" data-item-id="\${p.id}" onclick='toggleItem(\${JSON.stringify({id:p.id,name:p.name,price:p.price})})'>
          <div class="check-icon absolute top-2 right-2 w-5 h-5 bg-brand-pink text-white rounded-full flex items-center justify-center text-xs hidden"><i class="fas fa-check"></i></div>
          <img src="\${p.image_url || ''}" class="w-full h-24 object-cover rounded-lg mb-2">
          <h4 class="text-sm font-medium text-brand-maroon">\${p.name}</h4>
          <span class="text-brand-pink text-sm font-semibold">₹\${p.price.toLocaleString('en-IN')}</span>
        </div>
      \`).join('');

      // Load packaging
      const pkgRes = await fetch('/api/packaging-materials');
      const pkgData = await pkgRes.json();
      document.getElementById('packaging-options').innerHTML = pkgData.materials.map(pkg => \`
        <div class="pkg-option cursor-pointer p-4 rounded-xl border border-brand-pink-soft hover:border-brand-pink transition-all flex items-center gap-3" data-pkg-id="\${pkg.id}" onclick='togglePackaging(\${JSON.stringify(pkg)})'>
          <div class="w-10 h-10 bg-brand-pink-soft rounded-full flex items-center justify-center flex-shrink-0"><i class="fas fa-ribbon text-brand-pink"></i></div>
          <div class="flex-1"><h4 class="text-sm font-medium text-brand-maroon">\${pkg.name}</h4><p class="text-xs text-brand-maroon/50">\${pkg.description||''}</p></div>
          <span class="text-brand-pink font-semibold text-sm">₹\${pkg.price}</span>
        </div>
      \`).join('');
    }

    updateCartUI(); loadHamperData();
  </script>
</body>
</html>`)
})

// Admin Panel
app.get('/admin', (c) => c.redirect('/admin/login'))

app.get('/admin/login', (c) => {
  return c.html(`${htmlHead('Admin Login')}
<body class="bg-brand-ivory min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-20 mx-auto mb-4">
      <h1 class="font-serif text-3xl font-bold text-brand-maroon">Admin Portal</h1>
      <p class="text-brand-maroon/60 text-sm mt-2">Secure access to your management dashboard</p>
    </div>
    
    <div class="bg-white rounded-2xl border border-brand-pink-soft/50 shadow-xl p-8">
      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="mb-5">
          <label class="block text-sm font-medium text-brand-maroon mb-2">Email Address</label>
          <div class="relative">
            <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-brand-pink-light"></i>
            <input type="email" id="email" required placeholder="admin@littlepotli.com" class="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm">
          </div>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-brand-maroon mb-2">Password</label>
          <div class="relative">
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-brand-pink-light"></i>
            <input type="password" id="password" required placeholder="Enter your password" class="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink-soft outline-none text-sm">
          </div>
        </div>
        <div id="error-msg" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"></div>
        <button type="submit" class="w-full py-3 bg-brand-pink text-white rounded-xl font-medium hover:bg-brand-pink-hover transition-all shadow-lg shadow-brand-pink/30">
          <i class="fas fa-sign-in-alt mr-2"></i> Sign In
        </button>
      </form>
    </div>
    
    <p class="text-center text-xs text-brand-maroon/40 mt-6">
      <i class="fas fa-shield-alt mr-1"></i> Protected by encryption & 2FA
    </p>
  </div>

  <script>
    // Check if already logged in
    if (localStorage.getItem('lp_admin_token')) window.location.href = '/admin/dashboard';

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorEl = document.getElementById('error-msg');
      errorEl.classList.add('hidden');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (!res.ok) { errorEl.textContent = data.error || 'Login failed'; errorEl.classList.remove('hidden'); return; }
        if (data.user.role !== 'admin' && data.user.role !== 'manager') { errorEl.textContent = 'Access denied. Admin privileges required.'; errorEl.classList.remove('hidden'); return; }
        
        localStorage.setItem('lp_admin_token', data.token);
        localStorage.setItem('lp_admin_user', JSON.stringify(data.user));
        window.location.href = '/admin/dashboard';
      } catch (err) { errorEl.textContent = 'Connection error. Please try again.'; errorEl.classList.remove('hidden'); }
    }
  </script>
</body>
</html>`)
})

// Admin Dashboard
app.get('/admin/dashboard', (c) => {
  return c.html(`${htmlHead('Admin Dashboard')}
<body class="bg-gray-50 min-h-screen">
  <div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-brand-maroon text-white flex-shrink-0 hidden lg:flex flex-col">
      <div class="p-6 border-b border-white/10">
        <img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 brightness-0 invert">
        <p class="text-white/60 text-xs mt-2">Admin Dashboard</p>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <a href="/admin/dashboard" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white font-medium text-sm">
          <i class="fas fa-chart-line w-5"></i> Dashboard
        </a>
        <a href="#" onclick="showSection('orders')" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm transition-colors">
          <i class="fas fa-shopping-cart w-5"></i> Orders
        </a>
        <a href="#" onclick="showSection('products')" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm transition-colors">
          <i class="fas fa-gem w-5"></i> Products
        </a>
        <a href="#" onclick="showSection('categories')" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm transition-colors">
          <i class="fas fa-tags w-5"></i> Categories
        </a>
        <a href="#" onclick="showSection('customers')" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm transition-colors">
          <i class="fas fa-users w-5"></i> Customers
        </a>
        <a href="#" onclick="showSection('coupons')" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm transition-colors">
          <i class="fas fa-ticket-alt w-5"></i> Coupons
        </a>
        <a href="#" onclick="showSection('tickets')" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm transition-colors">
          <i class="fas fa-headset w-5"></i> Support
        </a>
        <a href="#" onclick="showSection('settings')" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm transition-colors">
          <i class="fas fa-cog w-5"></i> Settings
        </a>
      </nav>
      <div class="p-4 border-t border-white/10">
        <button onclick="logout()" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 text-sm w-full">
          <i class="fas fa-sign-out-alt w-5"></i> Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button class="lg:hidden text-brand-maroon" onclick="document.querySelector('aside').classList.toggle('hidden')"><i class="fas fa-bars text-xl"></i></button>
          <h1 class="font-serif text-2xl font-bold text-brand-maroon" id="page-title">Dashboard</h1>
        </div>
        <div class="flex items-center gap-4">
          <a href="/" target="_blank" class="text-sm text-brand-pink hover:text-brand-pink-hover"><i class="fas fa-external-link-alt mr-1"></i> View Store</a>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-brand-pink-soft rounded-full flex items-center justify-center"><i class="fas fa-user text-brand-pink text-sm"></i></div>
            <span id="admin-name" class="text-sm font-medium text-brand-maroon hidden sm:inline">Admin</span>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto p-6" id="main-content">
        <!-- Dashboard Section -->
        <section id="section-dashboard">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between mb-2"><i class="fas fa-rupee-sign text-brand-gold"></i><span class="text-xs text-green-500"><i class="fas fa-arrow-up"></i></span></div>
              <p class="text-2xl font-bold text-brand-maroon" id="stat-revenue">₹0</p>
              <p class="text-xs text-gray-500">Total Revenue</p>
            </div>
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between mb-2"><i class="fas fa-shopping-bag text-brand-pink"></i></div>
              <p class="text-2xl font-bold text-brand-maroon" id="stat-orders">0</p>
              <p class="text-xs text-gray-500">Total Orders</p>
            </div>
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between mb-2"><i class="fas fa-clock text-orange-400"></i></div>
              <p class="text-2xl font-bold text-brand-maroon" id="stat-pending">0</p>
              <p class="text-xs text-gray-500">Pending Orders</p>
            </div>
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between mb-2"><i class="fas fa-gem text-purple-400"></i></div>
              <p class="text-2xl font-bold text-brand-maroon" id="stat-products">0</p>
              <p class="text-xs text-gray-500">Products</p>
            </div>
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between mb-2"><i class="fas fa-exclamation-triangle text-red-400"></i></div>
              <p class="text-2xl font-bold text-brand-maroon" id="stat-lowstock">0</p>
              <p class="text-xs text-gray-500">Low Stock</p>
            </div>
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between mb-2"><i class="fas fa-users text-blue-400"></i></div>
              <p class="text-2xl font-bold text-brand-maroon" id="stat-customers">0</p>
              <p class="text-xs text-gray-500">Customers</p>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div class="p-5 border-b border-gray-100"><h3 class="font-serif text-lg font-bold text-brand-maroon">Recent Orders</h3></div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-600"><tr><th class="px-5 py-3 text-left">Order</th><th class="px-5 py-3 text-left">Customer</th><th class="px-5 py-3 text-left">Amount</th><th class="px-5 py-3 text-left">Status</th><th class="px-5 py-3 text-left">Date</th></tr></thead>
                <tbody id="recent-orders-table"></tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Orders Section -->
        <section id="section-orders" class="hidden">
          <div class="flex items-center justify-between mb-6">
            <div class="flex gap-2">
              <button onclick="loadOrders('')" class="px-4 py-2 rounded-lg text-sm bg-brand-pink text-white">All</button>
              <button onclick="loadOrders('pending')" class="px-4 py-2 rounded-lg text-sm bg-white border hover:bg-brand-pink-soft">Pending</button>
              <button onclick="loadOrders('processing')" class="px-4 py-2 rounded-lg text-sm bg-white border hover:bg-brand-pink-soft">Processing</button>
              <button onclick="loadOrders('shipped')" class="px-4 py-2 rounded-lg text-sm bg-white border hover:bg-brand-pink-soft">Shipped</button>
              <button onclick="loadOrders('delivered')" class="px-4 py-2 rounded-lg text-sm bg-white border hover:bg-brand-pink-soft">Delivered</button>
            </div>
          </div>
          <div class="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50"><tr><th class="px-5 py-3 text-left">Order #</th><th class="px-5 py-3 text-left">Customer</th><th class="px-5 py-3 text-left">Amount</th><th class="px-5 py-3 text-left">Payment</th><th class="px-5 py-3 text-left">Status</th><th class="px-5 py-3 text-left">Date</th><th class="px-5 py-3 text-left">Actions</th></tr></thead>
              <tbody id="orders-table"></tbody>
            </table>
          </div>
        </section>

        <!-- Products Section -->
        <section id="section-products" class="hidden">
          <div class="flex items-center justify-between mb-6">
            <p class="text-sm text-gray-500" id="products-count">Loading...</p>
            <button onclick="showProductForm()" class="px-4 py-2 bg-brand-pink text-white rounded-lg text-sm font-medium hover:bg-brand-pink-hover"><i class="fas fa-plus mr-1"></i> Add Product</button>
          </div>
          <div class="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left">Image</th><th class="px-4 py-3 text-left">Name</th><th class="px-4 py-3 text-left">Category</th><th class="px-4 py-3 text-left">Price</th><th class="px-4 py-3 text-left">Stock</th><th class="px-4 py-3 text-left">Status</th><th class="px-4 py-3 text-left">Actions</th></tr></thead>
              <tbody id="products-table"></tbody>
            </table>
          </div>
        </section>

        <!-- Categories Section -->
        <section id="section-categories" class="hidden">
          <div class="bg-white rounded-xl border shadow-sm p-6">
            <h3 class="font-serif text-lg font-bold text-brand-maroon mb-4">Manage Categories</h3>
            <div id="categories-list" class="space-y-2"></div>
          </div>
        </section>

        <!-- Customers Section -->
        <section id="section-customers" class="hidden">
          <div class="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50"><tr><th class="px-5 py-3 text-left">Name</th><th class="px-5 py-3 text-left">Email</th><th class="px-5 py-3 text-left">Orders</th><th class="px-5 py-3 text-left">Total Spent</th><th class="px-5 py-3 text-left">Joined</th></tr></thead>
              <tbody id="customers-table"></tbody>
            </table>
          </div>
        </section>

        <!-- Coupons Section -->
        <section id="section-coupons" class="hidden">
          <div class="flex justify-end mb-4">
            <button onclick="showCouponForm()" class="px-4 py-2 bg-brand-pink text-white rounded-lg text-sm"><i class="fas fa-plus mr-1"></i> Create Coupon</button>
          </div>
          <div class="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50"><tr><th class="px-5 py-3 text-left">Code</th><th class="px-5 py-3 text-left">Type</th><th class="px-5 py-3 text-left">Value</th><th class="px-5 py-3 text-left">Used</th><th class="px-5 py-3 text-left">Valid Until</th><th class="px-5 py-3 text-left">Status</th></tr></thead>
              <tbody id="coupons-table"></tbody>
            </table>
          </div>
        </section>

        <!-- Support Section -->
        <section id="section-tickets" class="hidden">
          <div class="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50"><tr><th class="px-5 py-3 text-left">ID</th><th class="px-5 py-3 text-left">Customer</th><th class="px-5 py-3 text-left">Subject</th><th class="px-5 py-3 text-left">Priority</th><th class="px-5 py-3 text-left">Status</th><th class="px-5 py-3 text-left">Date</th></tr></thead>
              <tbody id="tickets-table"></tbody>
            </table>
          </div>
        </section>

        <!-- Settings Section -->
        <section id="section-settings" class="hidden">
          <div class="bg-white rounded-xl border shadow-sm p-6">
            <h3 class="font-serif text-lg font-bold text-brand-maroon mb-6">Store Settings</h3>
            <form id="settings-form" onsubmit="saveSettings(event)" class="space-y-4 max-w-lg">
              <div><label class="text-sm font-medium text-gray-700 block mb-1">Store Name</label><input id="set-site_name" class="w-full p-2 border rounded-lg text-sm" value="Little Potli"></div>
              <div><label class="text-sm font-medium text-gray-700 block mb-1">Tagline</label><input id="set-tagline" class="w-full p-2 border rounded-lg text-sm"></div>
              <div><label class="text-sm font-medium text-gray-700 block mb-1">Contact Email</label><input id="set-contact_email" class="w-full p-2 border rounded-lg text-sm"></div>
              <div><label class="text-sm font-medium text-gray-700 block mb-1">Contact Phone</label><input id="set-contact_phone" class="w-full p-2 border rounded-lg text-sm"></div>
              <div><label class="text-sm font-medium text-gray-700 block mb-1">Free Shipping Threshold (₹)</label><input id="set-free_shipping_threshold" type="number" class="w-full p-2 border rounded-lg text-sm"></div>
              <div><label class="text-sm font-medium text-gray-700 block mb-1">GST Rate (%)</label><input id="set-gst_rate" type="number" class="w-full p-2 border rounded-lg text-sm"></div>
              <button type="submit" class="px-6 py-2 bg-brand-pink text-white rounded-lg text-sm font-medium hover:bg-brand-pink-hover">Save Settings</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  </div>

  <!-- Product Form Modal -->
  <div id="product-modal" class="fixed inset-0 z-50 hidden">
    <div class="absolute inset-0 bg-black/50" onclick="closeProductForm()"></div>
    <div class="absolute inset-4 md:inset-y-8 md:inset-x-20 bg-white rounded-2xl shadow-2xl overflow-y-auto">
      <div class="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
        <h3 class="font-serif text-xl font-bold text-brand-maroon" id="product-form-title">Add Product</h3>
        <button onclick="closeProductForm()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <form id="product-form" onsubmit="saveProduct(event)" class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" id="pf-id">
        <div><label class="text-sm font-medium text-gray-700 block mb-1">Name *</label><input id="pf-name" required class="w-full p-2 border rounded-lg text-sm"></div>
        <div><label class="text-sm font-medium text-gray-700 block mb-1">SKU</label><input id="pf-sku" class="w-full p-2 border rounded-lg text-sm"></div>
        <div><label class="text-sm font-medium text-gray-700 block mb-1">Price (₹) *</label><input id="pf-price" type="number" required class="w-full p-2 border rounded-lg text-sm"></div>
        <div><label class="text-sm font-medium text-gray-700 block mb-1">Compare Price (₹)</label><input id="pf-compare_price" type="number" class="w-full p-2 border rounded-lg text-sm"></div>
        <div><label class="text-sm font-medium text-gray-700 block mb-1">Category</label><select id="pf-category_id" class="w-full p-2 border rounded-lg text-sm"><option value="">Select</option></select></div>
        <div><label class="text-sm font-medium text-gray-700 block mb-1">Stock</label><input id="pf-stock" type="number" class="w-full p-2 border rounded-lg text-sm" value="0"></div>
        <div><label class="text-sm font-medium text-gray-700 block mb-1">Material</label><input id="pf-material" class="w-full p-2 border rounded-lg text-sm"></div>
        <div><label class="text-sm font-medium text-gray-700 block mb-1">Image URL</label><input id="pf-image_url" class="w-full p-2 border rounded-lg text-sm"></div>
        <div class="md:col-span-2"><label class="text-sm font-medium text-gray-700 block mb-1">Short Description</label><input id="pf-short_desc" class="w-full p-2 border rounded-lg text-sm"></div>
        <div class="md:col-span-2"><label class="text-sm font-medium text-gray-700 block mb-1">Full Description</label><textarea id="pf-description" rows="3" class="w-full p-2 border rounded-lg text-sm"></textarea></div>
        <div class="flex gap-4 items-center">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" id="pf-featured" class="accent-brand-pink"> Featured</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" id="pf-new_arrival" class="accent-brand-pink"> New Arrival</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" id="pf-best_seller" class="accent-brand-pink"> Best Seller</label>
        </div>
        <div class="md:col-span-2 pt-4 border-t">
          <button type="submit" class="px-8 py-2 bg-brand-pink text-white rounded-lg font-medium hover:bg-brand-pink-hover">Save Product</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const token = localStorage.getItem('lp_admin_token');
    if (!token) window.location.href = '/admin/login';
    const adminUser = JSON.parse(localStorage.getItem('lp_admin_user') || '{}');
    document.getElementById('admin-name').textContent = adminUser.name || 'Admin';

    const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    function logout() { localStorage.removeItem('lp_admin_token'); localStorage.removeItem('lp_admin_user'); window.location.href = '/admin/login'; }

    function showSection(section) {
      document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
      document.getElementById('section-' + section).classList.remove('hidden');
      document.getElementById('page-title').textContent = section.charAt(0).toUpperCase() + section.slice(1);
      
      // Update sidebar
      document.querySelectorAll('aside nav a').forEach(a => { a.classList.remove('bg-white/10', 'text-white', 'font-medium'); a.classList.add('text-white/70'); });
      
      // Load data
      if (section === 'orders') loadOrders('');
      if (section === 'products') loadProducts();
      if (section === 'categories') loadCategories();
      if (section === 'customers') loadCustomers();
      if (section === 'coupons') loadCoupons();
      if (section === 'tickets') loadTickets();
      if (section === 'settings') loadSettings();
      if (section === 'dashboard') loadDashboard();
    }

    function statusBadge(status) {
      const colors = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-indigo-100 text-indigo-700', packed: 'bg-purple-100 text-purple-700', shipped: 'bg-cyan-100 text-cyan-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-700' };
      return '<span class="px-2 py-1 rounded-full text-xs font-medium '+(colors[status]||'bg-gray-100 text-gray-600')+'">'+status+'</span>';
    }

    async function loadDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard', { headers });
        if (res.status === 401) { logout(); return; }
        const data = await res.json();
        document.getElementById('stat-revenue').textContent = '₹' + (data.stats.totalRevenue || 0).toLocaleString('en-IN');
        document.getElementById('stat-orders').textContent = data.stats.totalOrders;
        document.getElementById('stat-pending').textContent = data.stats.pendingOrders;
        document.getElementById('stat-products').textContent = data.stats.totalProducts;
        document.getElementById('stat-lowstock').textContent = data.stats.lowStock;
        document.getElementById('stat-customers').textContent = data.stats.totalCustomers;
        
        document.getElementById('recent-orders-table').innerHTML = (data.recentOrders || []).map(o => '<tr class="border-b"><td class="px-5 py-3 font-medium">'+o.order_number+'</td><td class="px-5 py-3">'+(o.customer_name||'Guest')+'</td><td class="px-5 py-3 font-semibold">₹'+o.total_amount.toLocaleString('en-IN')+'</td><td class="px-5 py-3">'+statusBadge(o.status)+'</td><td class="px-5 py-3 text-gray-500">'+new Date(o.created_at).toLocaleDateString()+'</td></tr>').join('') || '<tr><td colspan="5" class="px-5 py-8 text-center text-gray-400">No orders yet</td></tr>';
      } catch(err) { console.error(err); }
    }

    async function loadOrders(status) {
      const res = await fetch('/api/admin/orders' + (status ? '?status='+status : ''), { headers });
      const data = await res.json();
      document.getElementById('orders-table').innerHTML = (data.orders || []).map(o => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-5 py-3 font-medium">\${o.order_number}</td>
          <td class="px-5 py-3">\${o.customer_name || 'Guest'}</td>
          <td class="px-5 py-3 font-semibold">₹\${o.total_amount.toLocaleString('en-IN')}</td>
          <td class="px-5 py-3">\${o.payment_status === 'paid' ? '<span class="text-green-600 text-xs"><i class="fas fa-check-circle"></i> Paid</span>' : '<span class="text-orange-500 text-xs">Pending</span>'}</td>
          <td class="px-5 py-3">\${statusBadge(o.status)}</td>
          <td class="px-5 py-3 text-gray-500">\${new Date(o.created_at).toLocaleDateString()}</td>
          <td class="px-5 py-3">
            <select onchange="updateOrderStatus(\${o.id}, this.value)" class="text-xs border rounded px-2 py-1">
              <option value="pending" \${o.status==='pending'?'selected':''}>Pending</option>
              <option value="confirmed" \${o.status==='confirmed'?'selected':''}>Confirmed</option>
              <option value="processing" \${o.status==='processing'?'selected':''}>Processing</option>
              <option value="packed" \${o.status==='packed'?'selected':''}>Packed</option>
              <option value="shipped" \${o.status==='shipped'?'selected':''}>Shipped</option>
              <option value="delivered" \${o.status==='delivered'?'selected':''}>Delivered</option>
              <option value="cancelled" \${o.status==='cancelled'?'selected':''}>Cancelled</option>
            </select>
          </td>
        </tr>
      \`).join('') || '<tr><td colspan="7" class="px-5 py-8 text-center text-gray-400">No orders found</td></tr>';
    }

    async function updateOrderStatus(id, status) {
      await fetch('/api/admin/orders/'+id+'/status', { method: 'PUT', headers, body: JSON.stringify({ status }) });
    }

    async function loadProducts() {
      const res = await fetch('/api/admin/products', { headers });
      const data = await res.json();
      document.getElementById('products-count').textContent = data.products.length + ' products';
      document.getElementById('products-table').innerHTML = data.products.map(p => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3"><img src="\${p.image_url||''}" class="w-10 h-10 rounded-lg object-cover"></td>
          <td class="px-4 py-3 font-medium">\${p.name}</td>
          <td class="px-4 py-3 text-gray-500">\${p.category_name||'-'}</td>
          <td class="px-4 py-3 font-semibold">₹\${p.price.toLocaleString('en-IN')}</td>
          <td class="px-4 py-3 \${p.stock_quantity<=5?'text-red-500 font-medium':'text-gray-600'}">\${p.stock_quantity}</td>
          <td class="px-4 py-3">\${p.is_active?'<span class="text-green-600 text-xs"><i class="fas fa-check-circle"></i> Active</span>':'<span class="text-gray-400 text-xs">Inactive</span>'}</td>
          <td class="px-4 py-3"><button onclick="editProduct(\${p.id})" class="text-brand-pink text-xs mr-2"><i class="fas fa-edit"></i></button><button onclick="deleteProduct(\${p.id})" class="text-red-400 text-xs"><i class="fas fa-trash"></i></button></td>
        </tr>
      \`).join('');
    }

    function showProductForm(product = null) {
      document.getElementById('product-modal').classList.remove('hidden');
      document.getElementById('product-form-title').textContent = product ? 'Edit Product' : 'Add Product';
      if (product) {
        document.getElementById('pf-id').value = product.id;
        document.getElementById('pf-name').value = product.name;
        document.getElementById('pf-price').value = product.price;
        document.getElementById('pf-compare_price').value = product.compare_price || '';
        document.getElementById('pf-sku').value = product.sku || '';
        document.getElementById('pf-stock').value = product.stock_quantity;
        document.getElementById('pf-material').value = product.material || '';
        document.getElementById('pf-short_desc').value = product.short_description || '';
        document.getElementById('pf-description').value = product.description || '';
        document.getElementById('pf-featured').checked = product.is_featured;
        document.getElementById('pf-new_arrival').checked = product.is_new_arrival;
        document.getElementById('pf-best_seller').checked = product.is_best_seller;
      } else { document.getElementById('product-form').reset(); document.getElementById('pf-id').value = ''; }
      loadCategoryOptions();
    }

    function closeProductForm() { document.getElementById('product-modal').classList.add('hidden'); }

    async function loadCategoryOptions() {
      const res = await fetch('/api/admin/categories', { headers });
      const data = await res.json();
      document.getElementById('pf-category_id').innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => '<option value="'+c.id+'">'+c.name+'</option>').join('');
    }

    async function saveProduct(e) {
      e.preventDefault();
      const id = document.getElementById('pf-id').value;
      const body = {
        name: document.getElementById('pf-name').value,
        price: parseFloat(document.getElementById('pf-price').value),
        compare_price: parseFloat(document.getElementById('pf-compare_price').value) || null,
        sku: document.getElementById('pf-sku').value,
        category_id: parseInt(document.getElementById('pf-category_id').value) || null,
        stock_quantity: parseInt(document.getElementById('pf-stock').value) || 0,
        material: document.getElementById('pf-material').value,
        short_description: document.getElementById('pf-short_desc').value,
        description: document.getElementById('pf-description').value,
        image_url: document.getElementById('pf-image_url').value,
        is_featured: document.getElementById('pf-featured').checked ? 1 : 0,
        is_new_arrival: document.getElementById('pf-new_arrival').checked ? 1 : 0,
        is_best_seller: document.getElementById('pf-best_seller').checked ? 1 : 0,
        is_active: 1
      };
      const url = id ? '/api/admin/products/'+id : '/api/admin/products';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers, body: JSON.stringify(body) });
      closeProductForm(); loadProducts();
    }

    async function deleteProduct(id) {
      if (!confirm('Delete this product?')) return;
      await fetch('/api/admin/products/'+id, { method: 'DELETE', headers });
      loadProducts();
    }

    async function loadCategories() {
      const res = await fetch('/api/admin/categories', { headers });
      const data = await res.json();
      document.getElementById('categories-list').innerHTML = data.categories.map(c => '<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><span class="font-medium text-brand-maroon">'+c.name+'</span><span class="text-xs text-gray-400 ml-2">/'+c.slug+'</span></div><span class="text-xs '+(c.is_active?'text-green-500':'text-red-400')+'">'+(c.is_active?'Active':'Inactive')+'</span></div>').join('');
    }

    async function loadCustomers() {
      const res = await fetch('/api/admin/customers', { headers });
      const data = await res.json();
      document.getElementById('customers-table').innerHTML = (data.customers || []).map(c => '<tr class="border-b"><td class="px-5 py-3 font-medium">'+c.name+'</td><td class="px-5 py-3 text-gray-500">'+c.email+'</td><td class="px-5 py-3">'+c.order_count+'</td><td class="px-5 py-3 font-semibold">₹'+(c.total_spent||0).toLocaleString('en-IN')+'</td><td class="px-5 py-3 text-gray-500">'+new Date(c.created_at).toLocaleDateString()+'</td></tr>').join('') || '<tr><td colspan="5" class="px-5 py-8 text-center text-gray-400">No customers yet</td></tr>';
    }

    async function loadCoupons() {
      const res = await fetch('/api/admin/coupons', { headers });
      const data = await res.json();
      document.getElementById('coupons-table').innerHTML = data.coupons.map(c => '<tr class="border-b"><td class="px-5 py-3 font-mono font-medium">'+c.code+'</td><td class="px-5 py-3 capitalize">'+c.discount_type+'</td><td class="px-5 py-3 font-semibold">'+(c.discount_type==='percentage'?c.discount_value+'%':'₹'+c.discount_value)+'</td><td class="px-5 py-3">'+c.used_count+'/'+(c.usage_limit||'∞')+'</td><td class="px-5 py-3 text-gray-500">'+(c.valid_until?new Date(c.valid_until).toLocaleDateString():'No expiry')+'</td><td class="px-5 py-3">'+(c.is_active?'<span class="text-green-600 text-xs">Active</span>':'<span class="text-red-400 text-xs">Inactive</span>')+'</td></tr>').join('');
    }

    async function loadTickets() {
      const res = await fetch('/api/admin/tickets', { headers });
      const data = await res.json();
      document.getElementById('tickets-table').innerHTML = (data.tickets || []).map(t => '<tr class="border-b"><td class="px-5 py-3">#'+t.id+'</td><td class="px-5 py-3">'+(t.user_name||'Anonymous')+'</td><td class="px-5 py-3">'+t.subject+'</td><td class="px-5 py-3"><span class="text-xs px-2 py-1 rounded-full '+(t.priority==='high'||t.priority==='urgent'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-600')+'">'+t.priority+'</span></td><td class="px-5 py-3">'+statusBadge(t.status)+'</td><td class="px-5 py-3 text-gray-500">'+new Date(t.created_at).toLocaleDateString()+'</td></tr>').join('') || '<tr><td colspan="6" class="px-5 py-8 text-center text-gray-400">No tickets</td></tr>';
    }

    async function loadSettings() {
      const res = await fetch('/api/settings');
      const data = await res.json();
      Object.entries(data.settings).forEach(([key, val]) => {
        const el = document.getElementById('set-' + key);
        if (el) el.value = val;
      });
    }

    async function saveSettings(e) {
      e.preventDefault();
      const settings = {};
      document.querySelectorAll('[id^="set-"]').forEach(el => { settings[el.id.replace('set-', '')] = el.value; });
      await fetch('/api/admin/settings', { method: 'PUT', headers, body: JSON.stringify({ settings }) });
      alert('Settings saved!');
    }

    function showCouponForm() { alert('Coupon form coming soon - use API directly for now'); }

    // Initialize dashboard
    loadDashboard();
  </script>
</body>
</html>`)
})

// Collections page
app.get('/collections', (c) => {
  return c.html(`${htmlHead('Collections')}
<body class="bg-brand-ivory min-h-screen">
  <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-pink-soft shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        <a href="/"><img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 md:h-14 w-auto"></a>
        <div class="hidden md:flex items-center gap-8">
          <a href="/" class="nav-link text-brand-maroon font-medium text-sm">Home</a>
          <a href="/shop" class="nav-link text-brand-maroon font-medium text-sm">Shop</a>
          <a href="/collections" class="nav-link text-brand-pink font-medium text-sm">Collections</a>
          <a href="/build-hamper" class="nav-link text-brand-maroon font-medium text-sm">Build Hamper</a>
        </div>
        <div class="flex items-center gap-4">
          <a href="/shop" class="px-4 py-2 bg-brand-pink text-white rounded-full text-sm font-medium hover:bg-brand-pink-hover">Shop Now</a>
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-12">
      <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-2">Shop By</p>
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-brand-maroon">Our Collections</h1>
      <p class="text-brand-maroon/60 mt-3 max-w-lg mx-auto">Explore our carefully curated collections for every occasion and style</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="collections-grid">
      <a href="/shop?category=earrings" class="card-hover group relative h-72 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-brand-maroon/80 via-brand-maroon/20 to-transparent"></div>
        <div class="absolute bottom-6 left-6 text-white"><h3 class="font-serif text-2xl font-bold">Earrings</h3><p class="text-white/70 text-sm">Elegant drops & studs</p></div>
      </a>
      <a href="/shop?category=bracelets" class="card-hover group relative h-72 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-brand-maroon/80 via-brand-maroon/20 to-transparent"></div>
        <div class="absolute bottom-6 left-6 text-white"><h3 class="font-serif text-2xl font-bold">Bracelets</h3><p class="text-white/70 text-sm">Delicate charm & bangles</p></div>
      </a>
      <a href="/shop?category=hair-accessories" class="card-hover group relative h-72 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-brand-maroon/80 via-brand-maroon/20 to-transparent"></div>
        <div class="absolute bottom-6 left-6 text-white"><h3 class="font-serif text-2xl font-bold">Hair Accessories</h3><p class="text-white/70 text-sm">Clips, vines & bands</p></div>
      </a>
      <a href="/shop?category=gift-sets" class="card-hover group relative h-72 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-brand-maroon/80 via-brand-maroon/20 to-transparent"></div>
        <div class="absolute bottom-6 left-6 text-white"><h3 class="font-serif text-2xl font-bold">Gift Sets</h3><p class="text-white/70 text-sm">Ready-made hampers</p></div>
      </a>
      <a href="/shop?category=wedding-collection" class="card-hover group relative h-72 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-brand-maroon/80 via-brand-maroon/20 to-transparent"></div>
        <div class="absolute bottom-6 left-6 text-white"><h3 class="font-serif text-2xl font-bold">Wedding</h3><p class="text-white/70 text-sm">Bridal & ceremony</p></div>
      </a>
      <a href="/shop?category=festive-collection" class="card-hover group relative h-72 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-brand-maroon/80 via-brand-maroon/20 to-transparent"></div>
        <div class="absolute bottom-6 left-6 text-white"><h3 class="font-serif text-2xl font-bold">Festive</h3><p class="text-white/70 text-sm">Diwali & celebrations</p></div>
      </a>
    </div>
  </main>

  <footer class="bg-brand-maroon text-white py-8 mt-12">
    <div class="max-w-7xl mx-auto px-4 text-center">
      <img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 mx-auto mb-3 brightness-0 invert">
      <p class="text-white/60 text-sm">&copy; 2024 Little Potli. Curated Gifts, Crafted with Love.</p>
    </div>
  </footer>
</body>
</html>`)
})

// About page
app.get('/about', (c) => {
  return c.html(`${htmlHead('About Us')}
<body class="bg-brand-ivory min-h-screen">
  <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-pink-soft shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        <a href="/"><img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-12 md:h-14 w-auto"></a>
        <div class="hidden md:flex items-center gap-8">
          <a href="/" class="nav-link text-brand-maroon font-medium text-sm">Home</a>
          <a href="/shop" class="nav-link text-brand-maroon font-medium text-sm">Shop</a>
          <a href="/collections" class="nav-link text-brand-maroon font-medium text-sm">Collections</a>
          <a href="/build-hamper" class="nav-link text-brand-maroon font-medium text-sm">Build Hamper</a>
          <a href="/about" class="nav-link text-brand-pink font-medium text-sm">About</a>
        </div>
        <a href="/shop" class="px-4 py-2 bg-brand-pink text-white rounded-full text-sm">Shop Now</a>
      </div>
    </div>
  </nav>

  <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="text-center mb-12">
      <img src="https://www.genspark.ai/api/files/s/J5d3zi11" alt="Little Potli" class="h-24 mx-auto mb-6">
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-brand-maroon mb-4">Our Story</h1>
      <p class="text-brand-maroon/70 text-lg font-light leading-relaxed max-w-2xl mx-auto">
        Little Potli was born from a simple belief — that every gift should tell a story, every celebration deserves something special, and every piece of jewelry should make the wearer feel extraordinary.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
      <div class="bg-white rounded-2xl p-8 border border-brand-pink-soft/50 shadow-sm">
        <div class="w-12 h-12 bg-brand-pink-soft rounded-full flex items-center justify-center mb-4"><i class="fas fa-heart text-brand-pink text-xl"></i></div>
        <h3 class="font-serif text-2xl font-bold text-brand-maroon mb-3">Crafted with Love</h3>
        <p class="text-brand-maroon/60 leading-relaxed">Each accessory is carefully handpicked and curated to ensure the highest quality. We work with skilled artisans who pour their heart into every creation.</p>
      </div>
      <div class="bg-white rounded-2xl p-8 border border-brand-pink-soft/50 shadow-sm">
        <div class="w-12 h-12 bg-brand-pink-soft rounded-full flex items-center justify-center mb-4"><i class="fas fa-gift text-brand-pink text-xl"></i></div>
        <h3 class="font-serif text-2xl font-bold text-brand-maroon mb-3">Bespoke Gifting</h3>
        <p class="text-brand-maroon/60 leading-relaxed">Our hamper builder lets you create truly personalized gifts. From the box to the accessories, every element is chosen by you, making each hamper one-of-a-kind.</p>
      </div>
    </div>

    <div class="text-center bg-gradient-to-r from-brand-pink-soft to-brand-cream rounded-2xl p-10">
      <h2 class="font-serif text-3xl font-bold text-brand-maroon mb-4">Get in Touch</h2>
      <p class="text-brand-maroon/70 mb-6">We'd love to hear from you! Whether it's a custom order or just to say hello.</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="mailto:vaigau2105@gmail.com" class="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full text-brand-maroon border border-brand-pink-light hover:border-brand-pink transition-colors text-sm">
          <i class="fas fa-envelope text-brand-pink"></i> vaigau2105@gmail.com
        </a>
        <a href="https://wa.me/919034910627" class="inline-flex items-center gap-2 px-6 py-3 bg-green-500 rounded-full text-white hover:bg-green-600 transition-colors text-sm">
          <i class="fab fa-whatsapp"></i> +91 90349 10627
        </a>
      </div>
    </div>
  </main>

  <footer class="bg-brand-maroon text-white py-8">
    <div class="max-w-7xl mx-auto px-4 text-center">
      <p class="text-white/60 text-sm">&copy; 2024 Little Potli. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`)
})

export default app
