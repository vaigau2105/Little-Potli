import { htmlHead, navBar, footer, cartDrawer, cartScript, SiteConfig, DEFAULT_SITE_CONFIG } from './layout'

export function loginPage(config: SiteConfig = DEFAULT_SITE_CONFIG): string {
  return `${htmlHead('Login')}
<body class="bg-brand-ivory min-h-screen">
  ${navBar()}

  <main class="max-w-md mx-auto px-4 py-12">
    <div class="bg-white rounded-3xl shadow-lg border border-brand-pink-soft/50 p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-brand-pink-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-user text-2xl text-brand-pink"></i>
        </div>
        <h1 class="font-serif text-3xl font-bold text-brand-maroon">Welcome Back</h1>
        <p class="text-sm text-brand-maroon/60 mt-1">Sign in to your Little Potli account</p>
      </div>

      <form id="login-form" onsubmit="handleLogin(event)" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Email</label>
          <input type="email" id="email" required placeholder="you@example.com"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Password</label>
          <input type="password" id="password" required placeholder="Enter your password"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>
        <div id="error-message" class="hidden text-sm text-red-600 bg-red-50 rounded-lg p-3"></div>
        <button type="submit" id="login-btn"
          class="w-full py-3 bg-brand-pink text-white rounded-xl font-medium text-sm hover:bg-brand-pink-hover transition shadow-lg shadow-brand-pink/20 disabled:opacity-50">
          <i class="fas fa-sign-in-alt mr-2"></i> Sign In
        </button>
      </form>

      <p class="text-center text-sm text-brand-maroon/60 mt-6">
        Don&apos;t have an account?
        <a href="/signup" class="text-brand-pink font-medium hover:underline">Sign Up</a>
      </p>
    </div>
  </main>

  ${footer(config)}
  ${cartDrawer()}
  ${cartScript()}

  <script>
    // If already logged in, show account info
    const existingToken = localStorage.getItem('littlepotli_token');
    if (existingToken) {
      document.querySelector('main .bg-white').innerHTML =
        '<div class="text-center py-8">' +
        '<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-check text-green-500 text-2xl"></i></div>' +
        '<h2 class="font-serif text-2xl font-bold text-brand-maroon mb-2">You are logged in</h2>' +
        '<p class="text-brand-maroon/60 mb-6">Welcome back to Little Potli!</p>' +
        '<button onclick="customerLogout()" class="px-6 py-3 border-2 border-brand-pink text-brand-pink rounded-full font-medium hover:bg-brand-pink hover:text-white transition text-sm"><i class="fas fa-sign-out-alt mr-2"></i>Sign Out</button>' +
        '</div>';
    }

    function customerLogout() {
      localStorage.removeItem('littlepotli_token');
      localStorage.removeItem('littlepotli_user');
      window.location.reload();
    }

    async function handleLogin(e) {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const errorEl = document.getElementById('error-message');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
      errorEl.classList.add('hidden');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('littlepotli_token', data.token);
        localStorage.setItem('littlepotli_user', JSON.stringify(data.user));
        window.location.href = '/';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Sign In';
      }
    }
  </script>
</body>
</html>`
}
