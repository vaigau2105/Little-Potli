-- Little Potli Seed Data

-- Admin users (password: admin123 - SHA256 hash: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
INSERT OR IGNORE INTO users (email, name, phone, password_hash, role) VALUES
  ('admin@littlepotli.com', 'Little Potli Admin', '+919034910627', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'),
  ('vaigau2105@gmail.com', 'Vaigau', '+919034910627', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin');

-- Categories
INSERT OR IGNORE INTO categories (name, slug, description, sort_order) VALUES
  ('Earrings', 'earrings', 'Elegant handcrafted earrings for every occasion', 1),
  ('Bracelets', 'bracelets', 'Delicate bracelets that add charm to your wrist', 2),
  ('Hair Accessories', 'hair-accessories', 'Beautiful clips, pins and bands for your hair', 3),
  ('Pendants & Necklaces', 'pendants-necklaces', 'Statement pieces that speak elegance', 4),
  ('Gift Sets', 'gift-sets', 'Curated gift sets for special moments', 5),
  ('Wedding Collection', 'wedding-collection', 'Bridal and wedding ceremony accessories', 6),
  ('Corporate Gifts', 'corporate-gifts', 'Premium corporate gifting solutions', 7),
  ('Festive Collection', 'festive-collection', 'Diwali, Rakhi & festive season specials', 8);

-- Products
INSERT OR IGNORE INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, material, is_active, is_featured, is_new_arrival, is_best_seller) VALUES
  ('Rose Gold Pearl Drops', 'rose-gold-pearl-drops', 'Exquisite rose gold earrings with freshwater pearl drops. Perfect for weddings and special occasions. Each piece is handcrafted with love.', 'Handcrafted rose gold earrings with freshwater pearls', 1499, 1999, 'LP-EAR-001', 1, 25, 'Rose Gold, Freshwater Pearls', 1, 1, 1, 1),
  ('Champagne Crystal Studs', 'champagne-crystal-studs', 'Sparkling champagne-toned crystal studs set in sterling silver. Elegant enough for formal events, subtle enough for daily wear.', 'Crystal studs in champagne tone', 899, 1299, 'LP-EAR-002', 1, 40, 'Sterling Silver, Swarovski Crystal', 1, 1, 0, 1),
  ('Blush Pink Charm Bracelet', 'blush-pink-charm-bracelet', 'A delicate charm bracelet featuring tiny rose quartz beads and gold-plated charms. Adjustable chain for perfect fit.', 'Rose quartz charm bracelet', 1299, 1599, 'LP-BRC-001', 2, 30, 'Gold Plated, Rose Quartz', 1, 1, 1, 0),
  ('Ivory Silk Thread Bangle Set', 'ivory-silk-thread-bangle-set', 'Set of 4 handwoven silk thread bangles in ivory and gold. Traditional craft meets modern elegance.', 'Set of 4 silk thread bangles', 799, 999, 'LP-BRC-002', 2, 50, 'Silk Thread, Gold Wire', 1, 0, 0, 1),
  ('Pearl Hair Vine', 'pearl-hair-vine', 'A stunning bridal hair vine adorned with tiny pearls and crystal beads. Flexible wire allows custom styling.', 'Bridal pearl hair vine', 2499, 2999, 'LP-HAIR-001', 3, 15, 'Pearl, Crystal, Gold Wire', 1, 1, 1, 0),
  ('Floral Hair Clip Set', 'floral-hair-clip-set', 'Set of 3 handmade floral hair clips in soft pink and ivory tones. Perfect for bridesmaids or everyday elegance.', 'Set of 3 floral hair clips', 699, 899, 'LP-HAIR-002', 3, 60, 'Fabric Flowers, Metal Clip', 1, 0, 1, 1),
  ('Teardrop Pendant Necklace', 'teardrop-pendant-necklace', 'A mesmerizing teardrop-shaped pendant in rose gold with a delicate chain. Makes a perfect gift for loved ones.', 'Rose gold teardrop pendant', 1899, 2399, 'LP-PND-001', 4, 20, 'Rose Gold, CZ Stone', 1, 1, 0, 1),
  ('Layered Chain Necklace', 'layered-chain-necklace', 'Three-layer gold chain necklace with tiny charms - a star, moon, and heart. Modern minimalist design.', 'Triple layer charm necklace', 1599, 1999, 'LP-PND-002', 4, 35, 'Gold Plated, Brass', 1, 0, 1, 0),
  ('Bridal Bliss Gift Set', 'bridal-bliss-gift-set', 'Complete bridal accessory set including earrings, necklace, hair pin and bracelet. Comes in a luxury wooden box.', 'Complete bridal accessory gift set', 5999, 7499, 'LP-GFT-001', 5, 10, 'Mixed Premium', 1, 1, 0, 1),
  ('Festive Glow Hamper', 'festive-glow-hamper', 'A curated Diwali gift hamper with earrings, bracelet, scented candle and artisan chocolates in a premium gift box.', 'Curated Diwali gift hamper', 3499, 4299, 'LP-GFT-002', 5, 20, 'Mixed', 1, 1, 1, 0),
  ('Corporate Elegance Box', 'corporate-elegance-box', 'Premium corporate gift box with pearl studs, silk scarf, and personalized card. Minimum order: 10 pieces.', 'Premium corporate gift box', 2999, 3999, 'LP-CRP-001', 7, 100, 'Mixed Premium', 1, 0, 0, 0),
  ('Diwali Sparkle Collection', 'diwali-sparkle-collection', 'Festive collection featuring gold-toned jhumkas, bangles, and a statement necklace. Celebrate in style.', 'Festive gold-toned jewelry set', 4499, 5499, 'LP-FST-001', 8, 15, 'Gold Plated, Kundan', 1, 1, 1, 1);

-- Product Images (using placeholder elegant images)
INSERT OR IGNORE INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
  (1, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600', 'Rose Gold Pearl Drop Earrings', 1, 0),
  (2, 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=600', 'Champagne Crystal Studs', 1, 0),
  (3, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600', 'Blush Pink Charm Bracelet', 1, 0),
  (4, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', 'Ivory Silk Thread Bangles', 1, 0),
  (5, 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600', 'Pearl Hair Vine', 1, 0),
  (6, 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600', 'Floral Hair Clip Set', 1, 0),
  (7, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'Teardrop Pendant Necklace', 1, 0),
  (8, 'https://images.unsplash.com/photo-1515562141589-67f0d93b2f6e?w=600', 'Layered Chain Necklace', 1, 0),
  (9, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600', 'Bridal Bliss Gift Set', 1, 0),
  (10, 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600', 'Festive Glow Hamper', 1, 0),
  (11, 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600', 'Corporate Elegance Box', 1, 0),
  (12, 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600', 'Diwali Sparkle Collection', 1, 0);

-- Product Tags
INSERT OR IGNORE INTO product_tags (product_id, tag) VALUES
  (1, 'wedding'), (1, 'bridal'), (1, 'elegant'),
  (2, 'daily-wear'), (2, 'office'), (2, 'minimal'),
  (3, 'casual'), (3, 'gift'), (3, 'trendy'),
  (4, 'traditional'), (4, 'festive'), (4, 'handmade'),
  (5, 'bridal'), (5, 'wedding'), (5, 'premium'),
  (6, 'casual'), (6, 'bridesmaids'), (6, 'floral'),
  (7, 'gift'), (7, 'elegant'), (7, 'premium'),
  (8, 'trendy'), (8, 'minimal'), (8, 'layered'),
  (9, 'wedding'), (9, 'bridal'), (9, 'gift-set'),
  (10, 'diwali'), (10, 'festive'), (10, 'gift-set'),
  (11, 'corporate'), (11, 'bulk'), (11, 'premium'),
  (12, 'diwali'), (12, 'festive'), (12, 'traditional');

-- Hamper Boxes
INSERT OR IGNORE INTO hamper_boxes (name, tier, description, price, max_items, dimensions) VALUES
  ('Classic Rose Box', 'classic', 'Elegant pastel pink box with satin ribbon closure', 299, 4, '20x15x10 cm'),
  ('Premium Velvet Box', 'premium', 'Luxurious velvet-lined box in champagne gold', 599, 6, '25x20x12 cm'),
  ('Luxury Silk Box', 'luxury', 'Hand-stitched silk box with embroidered details', 999, 8, '30x25x15 cm'),
  ('Artisan Wooden Chest', 'wooden', 'Hand-carved wooden chest with brass fittings', 1499, 10, '35x28x18 cm');

-- Packaging Materials
INSERT OR IGNORE INTO packaging_materials (name, description, price) VALUES
  ('Tissue Paper - Blush Pink', 'Soft tissue paper in signature blush pink', 49),
  ('Satin Ribbon - Champagne', 'Premium satin ribbon in champagne gold', 79),
  ('Dried Flower Garnish', 'Natural dried flowers for elegant decoration', 149),
  ('Personalized Gift Tag', 'Custom printed tag with your message', 99),
  ('Wax Seal Stamp', 'Traditional wax seal in rose gold', 199);

-- Coupons
INSERT OR IGNORE INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, valid_from, valid_until) VALUES
  ('WELCOME10', 'Welcome 10% off on first order', 'percentage', 10, 500, 500, 1000, '2024-01-01', '2027-12-31'),
  ('DIWALI25', 'Diwali Special 25% off', 'percentage', 25, 1000, 1500, 500, '2026-09-01', '2026-12-31'),
  ('FLAT200', 'Flat Rs 200 off on orders above 1500', 'fixed', 200, 1500, 200, 300, '2024-01-01', '2027-12-31');

-- Site Settings
INSERT OR IGNORE INTO site_settings (key, value, type) VALUES
  ('site_name', 'Little Potli', 'text'),
  ('tagline', 'Curated Gifts, Crafted with Love', 'text'),
  ('contact_email', 'potli.little@gmail.com', 'text'),
  ('contact_phone', '+91 90349 10627', 'text'),
  ('instagram_url', 'https://instagram.com/littlepotli', 'text'),
  ('whatsapp_number', '+919034910627', 'text'),
  ('free_shipping_threshold', '1999', 'number'),
  ('gst_rate', '18', 'number'),
  ('hero_title', 'Curated Gifts, Crafted with Love', 'text'),
  ('hero_subtitle', 'Discover handpicked accessories and build your perfect gift hamper', 'text');
