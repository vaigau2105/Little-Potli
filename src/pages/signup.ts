import { htmlHead, navBar, footer, cartDrawer, cartScript, SiteConfig, DEFAULT_SITE_CONFIG } from './layout'

export function signupPage(config: SiteConfig = DEFAULT_SITE_CONFIG): string {
  return `${htmlHead('Create Account')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar()}

  <main class="max-w-md mx-auto px-4 py-12">
    <div class="bg-white rounded-3xl shadow-lg border border-brand-pink-soft/50 p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-brand-pink-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-user-plus text-2xl text-brand-pink"></i>
        </div>
        <h1 class="font-serif text-3xl font-bold text-brand-maroon">Create Account</h1>
        <p class="text-sm text-brand-maroon/60 mt-1">Join Little Potli for a delightful shopping experience</p>
      </div>

      <form id="signup-form" onsubmit="handleSignup(event)" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Full Name <span class="text-red-400">*</span></label>
          <input type="text" id="name" required placeholder="Your full name" minlength="2" maxlength="100"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>

        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Email <span class="text-red-400">*</span></label>
          <input type="email" id="email" required placeholder="you@example.com"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>

        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Phone <span class="text-brand-maroon/40 text-xs">(optional)</span></label>
          <input type="tel" id="phone" placeholder="+91 98765 43210" maxlength="15"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>

        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Password <span class="text-red-400">*</span></label>
          <input type="password" id="password" required placeholder="Min. 8 characters" minlength="8" maxlength="128"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
          <p class="text-xs text-brand-maroon/40 mt-1">At least 8 characters</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Confirm Password <span class="text-red-400">*</span></label>
          <input type="password" id="confirm-password" required placeholder="Re-enter your password" minlength="8" maxlength="128"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>

        <div id="error-message" class="hidden text-sm text-red-600 bg-red-50 rounded-lg p-3"></div>
        <div id="success-message" class="hidden text-sm text-green-700 bg-green-50 rounded-lg p-3"></div>

        <button type="submit" id="signup-btn"
          class="w-full py-3 bg-brand-pink text-white rounded-xl font-medium text-sm hover:bg-brand-pink-hover transition shadow-lg shadow-brand-pink/20 disabled:opacity-50">
          <i class="fas fa-user-plus mr-2"></i> Create Account
        </button>
      </form>

      <p class="text-center text-sm text-brand-maroon/60 mt-6">
        Already have an account?
        <a href="/login" class="text-brand-pink font-medium hover:underline">Sign In</a>
      </p>
    </div>
  </main>

  ${footer(config)}
  ${cartDrawer()}
  ${cartScript()}

  <script>
    // If already logged in, redirect to home
    if (localStorage.getItem('littlepotli_token')) {
      window.location.href = '/';
    }

    async function handleSignup(e) {
      e.preventDefault();
      const btn = document.getElementById('signup-btn');
      const errorEl = document.getElementById('error-message');
      const successEl = document.getElementById('success-message');
      errorEl.classList.add('hidden');
      successEl.classList.add('hidden');

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      // Client-side validation
      if (name.length < 2) {
        errorEl.textContent = 'Name must be at least 2 characters.';
        errorEl.classList.remove('hidden');
        return;
      }

      if (password.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters.';
        errorEl.classList.remove('hidden');
        return;
      }

      if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.classList.remove('hidden');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating account...';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone: phone || undefined, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        // Auto-login: store token and redirect
        if (data.token) {
          localStorage.setItem('littlepotli_token', data.token);
          localStorage.setItem('littlepotli_user', JSON.stringify(data.user));
          successEl.textContent = 'Account created! Redirecting...';
          successEl.classList.remove('hidden');
          setTimeout(function() { window.location.href = '/'; }, 1000);
        } else {
          // Fallback: redirect to login
          successEl.textContent = 'Account created! Redirecting to login...';
          successEl.classList.remove('hidden');
          setTimeout(function() { window.location.href = '/login'; }, 1500);
        }
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i> Create Account';
      }
    }
  </script>
</body>
</html>`
}
