# Little Potli - Curated Gifts, Crafted with Love

## Project Overview
- **Name**: Little Potli
- **Goal**: A premium gifting business e-commerce platform with customer storefront and connected admin panel
- **Brand Aesthetic**: Elegant, warm, classy - Soft Rose Pink, Warm Ivory, Champagne Gold
- **Tech Stack**: Hono + TypeScript + Cloudflare D1 + TailwindCSS

## Live URLs
- **Customer Storefront**: https://3000-ixlngd0cu8a50d79ygto3-5185f4aa.sandbox.novita.ai
- **Admin Panel**: https://3000-ixlngd0cu8a50d79ygto3-5185f4aa.sandbox.novita.ai/admin/login

## Admin Credentials (Demo)
- **Email**: admin@littlepotli.com
- **Password**: admin123

## Features Implemented

### Customer Frontend
- **Homepage** - Hero banner, featured products, best sellers, categories, CTA sections
- **Shop Page** (`/shop`) - Full product catalog with filters (category, price range, sort)
- **Product Detail** (`/product/:slug`) - Image gallery, pricing, stock status, WhatsApp enquiry
- **Build Hamper** (`/build-hamper`) - 5-step wizard (Box → Items → Packaging → Message → Review)
- **Collections** (`/collections`) - Visual category browsing
- **About** (`/about`) - Brand story and contact info
- **Cart** - Slide-out drawer, quantity management, localStorage persistence
- **Wishlist** - Heart toggle on products, counter badge
- **Search** - Header search bar with redirect to shop

### Admin Panel
- **Secure Login** (`/admin/login`) - Email/password with role validation
- **Dashboard** (`/admin/dashboard`) - KPI cards (revenue, orders, products, low stock, customers)
- **Orders Management** - View all orders, filter by status, update order status
- **Products CRUD** - Create, edit, delete products with modal form
- **Categories** - View and manage product categories
- **Customers** - Customer list with order count and total spent
- **Coupons** - View promotional codes and usage stats
- **Support Tickets** - View customer support requests
- **Settings** - CMS for store name, contact info, shipping threshold, GST rate
- **Audit Logging** - All admin actions are tracked

### Shared Infrastructure
- **Database**: Cloudflare D1 (SQLite) with full relational schema
- **API**: RESTful API connecting both frontend and admin
- **Auth**: Token-based authentication with RBAC (admin/manager/customer roles)

## API Endpoints

### Public APIs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List active categories |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:slug` | Product detail with images, tags, reviews |
| GET | `/api/hamper-boxes` | Available hamper box types |
| GET | `/api/packaging-materials` | Packaging material options |
| POST | `/api/coupons/validate` | Validate a coupon code |
| POST | `/api/orders` | Create a new order |
| GET | `/api/settings` | Public site settings |
| POST | `/api/auth/login` | User/admin login |

### Admin APIs (requires Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Dashboard statistics |
| GET | `/api/admin/products` | All products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/orders` | All orders (filterable) |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/orders/:id` | Order details |
| GET | `/api/admin/categories` | All categories |
| POST | `/api/admin/categories` | Create category |
| GET | `/api/admin/coupons` | All coupons |
| POST | `/api/admin/coupons` | Create coupon |
| GET | `/api/admin/tickets` | Support tickets |
| PUT | `/api/admin/tickets/:id` | Update ticket |
| GET | `/api/admin/customers` | Customer list |
| PUT | `/api/admin/settings` | Update site settings |
| GET | `/api/admin/audit-log` | Admin activity log |

## Database Schema
- `users` - Customers and admins with RBAC
- `addresses` - User shipping addresses
- `categories` - Product categories (hierarchical)
- `products` - Product catalog with pricing
- `product_images` - Multiple images per product
- `product_tags` - Tags for filtering (occasion, style)
- `hamper_boxes` - Gift box types (classic/premium/luxury/wooden)
- `packaging_materials` - Packaging extras
- `orders` - Order records with full status tracking
- `order_items` - Individual items in orders
- `custom_hampers` - Saved hamper configurations
- `hamper_items` - Items in custom hampers
- `wishlists` - User wishlists
- `coupons` - Promotional codes
- `reviews` - Product reviews
- `support_tickets` - Customer support
- `audit_log` - Admin action history
- `site_settings` - CMS key-value store

## Phases Not Yet Implemented
- **Phase 4**: Full checkout pipeline (payment gateway integration with Razorpay)
- **Phase 5**: Customer account dashboard, order tracking, rewards
- **Phase 6**: Advanced logistics (courier API, packing slips, delivery slots)
- **Phase 7**: Email/SMS notifications, reporting exports, CI/CD

## Recommended Next Steps
1. Integrate Razorpay payment gateway for checkout
2. Add customer registration and account pages
3. Implement email notifications (SendGrid/Resend)
4. Add image upload via Cloudflare R2
5. Deploy to Cloudflare Pages for production
6. Set up proper JWT authentication
7. Implement 2FA for admin
8. Add WhatsApp Business API integration

## Deployment
- **Platform**: Cloudflare Pages (ready)
- **Database**: Cloudflare D1
- **Status**: Development (Local)
- **Last Updated**: 2026-06-25
