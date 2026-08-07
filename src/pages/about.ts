import { htmlHead, navBar, footer, cartDrawer, cartScript, SiteConfig, DEFAULT_SITE_CONFIG } from './layout'

export function aboutPage(config: SiteConfig = DEFAULT_SITE_CONFIG): string {
  return `${htmlHead('About Us')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar('about')}
  <main>
    <!-- Hero -->
    <section class="brand-gradient py-16 md:py-24">
      <div class="max-w-4xl mx-auto px-4 text-center fade-in">
        <p class="text-brand-gold text-sm tracking-[0.2em] uppercase mb-3">Our Story</p>
        <h1 class="font-serif text-4xl md:text-6xl font-bold text-brand-maroon mb-6">Little Potli</h1>
        <p class="text-brand-maroon/70 text-lg leading-relaxed max-w-2xl mx-auto">
          Born from a love for beautiful things and meaningful connections, Little Potli is your go-to destination for thoughtfully curated gifts and handpicked accessories.
        </p>
      </div>
    </section>

    <!-- Our Mission -->
    <section class="py-16 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p class="text-brand-gold text-xs tracking-[0.2em] uppercase mb-2">What We Believe</p>
            <h2 class="font-serif text-3xl font-bold text-brand-maroon mb-4">Curated with Love,<br>Crafted with Care</h2>
            <p class="text-brand-maroon/70 leading-relaxed mb-4">
              At Little Potli, we believe that every gift should be as special as the person receiving it. We handpick each product in our collection, ensuring that it meets our standards of quality, aesthetics, and meaningfulness.
            </p>
            <p class="text-brand-maroon/70 leading-relaxed mb-4">
              From elegant earrings and statement accessories to bespoke gift hampers, every piece in our collection tells a story of craftsmanship and love.
            </p>
            <p class="text-brand-maroon/70 leading-relaxed">
              Whether you're celebrating a birthday, anniversary, festival, or just want to show someone you care - Little Potli helps you find (or build) the perfect gift.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-brand-pink-soft rounded-2xl p-8 text-center card-hover">
              <i class="fas fa-heart text-3xl text-brand-pink mb-3"></i>
              <h3 class="font-serif text-lg font-bold text-brand-maroon">Made with Love</h3>
              <p class="text-xs text-brand-maroon/60 mt-2">Every piece is curated with intention</p>
            </div>
            <div class="bg-brand-cream rounded-2xl p-8 text-center card-hover mt-6">
              <i class="fas fa-gem text-3xl text-brand-gold mb-3"></i>
              <h3 class="font-serif text-lg font-bold text-brand-maroon">Premium Quality</h3>
              <p class="text-xs text-brand-maroon/60 mt-2">Only the finest materials and craftsmanship</p>
            </div>
            <div class="bg-brand-cream rounded-2xl p-8 text-center card-hover">
              <i class="fas fa-gift text-3xl text-brand-gold mb-3"></i>
              <h3 class="font-serif text-lg font-bold text-brand-maroon">Custom Hampers</h3>
              <p class="text-xs text-brand-maroon/60 mt-2">Build your perfect gift box</p>
            </div>
            <div class="bg-brand-pink-soft rounded-2xl p-8 text-center card-hover mt-6">
              <i class="fas fa-truck text-3xl text-brand-pink mb-3"></i>
              <h3 class="font-serif text-lg font-bold text-brand-maroon">Pan-India Delivery</h3>
              <p class="text-xs text-brand-maroon/60 mt-2">We deliver joy across India</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="py-16 bg-brand-ivory">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <p class="text-brand-gold text-xs tracking-[0.2em] uppercase mb-2">Why Choose Us</p>
          <h2 class="font-serif text-3xl font-bold text-brand-maroon">The Little Potli Promise</h2>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i class="fas fa-hand-holding-heart text-2xl text-brand-pink"></i>
            </div>
            <h3 class="font-serif text-base font-bold text-brand-maroon mb-2">Handpicked Selection</h3>
            <p class="text-sm text-brand-maroon/60">Each product is personally curated for quality and uniqueness.</p>
          </div>
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i class="fas fa-box-open text-2xl text-brand-pink"></i>
            </div>
            <h3 class="font-serif text-base font-bold text-brand-maroon mb-2">Beautiful Packaging</h3>
            <p class="text-sm text-brand-maroon/60">Premium gift-ready packaging that makes every unboxing special.</p>
          </div>
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i class="fas fa-shield-alt text-2xl text-brand-pink"></i>
            </div>
            <h3 class="font-serif text-base font-bold text-brand-maroon mb-2">Secure Payments</h3>
            <p class="text-sm text-brand-maroon/60">Safe and secure payments via Razorpay with multiple options.</p>
          </div>
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i class="fas fa-headset text-2xl text-brand-pink"></i>
            </div>
            <h3 class="font-serif text-base font-bold text-brand-maroon mb-2">Customer Support</h3>
            <p class="text-sm text-brand-maroon/60">We're always here to help via WhatsApp or email.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <p class="text-brand-gold text-xs tracking-[0.2em] uppercase mb-2">Get in Touch</p>
        <h2 class="font-serif text-3xl font-bold text-brand-maroon mb-8">Contact Us</h2>
        <div class="grid sm:grid-cols-3 gap-6">
          <a href="mailto:${config.storeEmail}" class="block bg-brand-ivory rounded-2xl p-6 hover:shadow-md transition">
            <i class="fas fa-envelope text-2xl text-brand-pink mb-3"></i>
            <h3 class="font-serif text-base font-bold text-brand-maroon">Email</h3>
            <p class="text-sm text-brand-maroon/60 mt-1">${config.storeEmail}</p>
          </a>
          <a href="https://wa.me/919034910627" target="_blank" class="block bg-brand-ivory rounded-2xl p-6 hover:shadow-md transition">
            <i class="fab fa-whatsapp text-2xl text-green-500 mb-3"></i>
            <h3 class="font-serif text-base font-bold text-brand-maroon">WhatsApp</h3>
            <p class="text-sm text-brand-maroon/60 mt-1">+91 90349 10627</p>
          </a>
          <a href="https://www.instagram.com/littlepotli" target="_blank" class="block bg-brand-ivory rounded-2xl p-6 hover:shadow-md transition">
            <i class="fab fa-instagram text-2xl text-pink-500 mb-3"></i>
            <h3 class="font-serif text-base font-bold text-brand-maroon">Instagram</h3>
            <p class="text-sm text-brand-maroon/60 mt-1">@littlepotli</p>
          </a>
        </div>
      </div>
    </section>
  </main>
  ${footer(config)}
  ${cartDrawer()}
  ${cartScript()}
</body>
</html>`
}
