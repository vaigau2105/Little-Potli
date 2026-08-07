import { htmlHead } from './layout'

export function adminLoginPage(): string {
  return `${htmlHead('Admin Login')}
<body class="bg-brand-ivory min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-3xl shadow-lg border border-brand-pink-soft/50 p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-brand-pink-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-lock text-2xl text-brand-pink"></i>
        </div>
        <h1 class="font-serif text-2xl font-bold text-brand-maroon">Admin Panel</h1>
        <p class="text-sm text-brand-maroon/60 mt-1">Little Potli Store Management</p>
      </div>

      <form id="login-form" onsubmit="handleLogin(event)" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Email</label>
          <input type="email" id="email" required placeholder="admin@littlepotli.com"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-brand-maroon mb-1">Password</label>
          <input type="password" id="password" required placeholder="Enter your password"
            class="w-full px-4 py-3 rounded-xl border border-brand-pink-light focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition text-sm">
        </div>
        <div id="error-message" class="hidden text-sm text-red-600 bg-red-50 rounded-lg p-3"></div>
        <button type="submit" id="login-btn"
          class="w-full py-3 bg-brand-pink text-white rounded-xl font-medium text-sm hover:bg-brand-pink-hover transition shadow-lg shadow-brand-pink/20 disabled:opacity-50 disabled:cursor-not-allowed">
          <i class="fas fa-sign-in-alt mr-2"></i> Sign In
        </button>
      </form>

      <div class="mt-6 text-center">
        <a href="/" class="text-sm text-brand-maroon/50 hover:text-brand-pink transition">
          <i class="fas fa-arrow-left mr-1"></i> Back to Store
        </a>
      </div>
    </div>
  </div>

  <script>
    // Check if already logged in
    const token = localStorage.getItem('littlepotli_admin_token');
    if (token) {
      window.location.href = '/admin/dashboard';
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
        if (!res.ok) {
          throw new Error(data.error || 'Login failed');
        }

        if (data.user.role !== 'admin' && data.user.role !== 'manager') {
          throw new Error('Access denied. Admin privileges required.');
        }

        localStorage.setItem('littlepotli_admin_token', data.token);
        localStorage.setItem('littlepotli_admin_user', JSON.stringify(data.user));
        window.location.href = '/admin/dashboard';
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
