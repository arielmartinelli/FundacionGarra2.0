import { supabase } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  /* ==========================================
     THEME TOGGLE (DARK / LIGHT MODE)
     ========================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  /* ==========================================
     MOBILE NAVIGATION MENU
     ========================================== */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const isOpen = navMenu.classList.contains('active');
      mobileToggle.innerHTML = isOpen 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      });
    });
  }

  /* ==========================================
     AUTHENTICATION LOGIC (SUPABASE AUTH)
     ========================================== */
  const loginForm = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error-box');
  const btnLoginSubmit = document.getElementById('btn-login-submit');

  // Check if user is already logged in, redirect directly to admin panel
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = './admin.html';
      }
    } catch (err) {
      console.warn('Supabase Auth error or credentials missing: ', err.message);
    }
  };

  // Run session check on load
  await checkSession();

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      // Reset UI states
      errorBox.style.display = 'none';
      btnLoginSubmit.disabled = true;
      btnLoginSubmit.textContent = 'Verificando...';

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Login successful, redirect
        window.location.href = './admin.html';
      } catch (err) {
        console.error('Error logging in: ', err.message);
        
        // Show styled error
        errorBox.textContent = translateAuthError(err.message);
        errorBox.style.display = 'block';
        
        // Restore button state
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.textContent = 'Ingresar al Panel';
      }
    });
  }

  // Local helper to translate common Supabase error messages to Spanish
  function translateAuthError(msg) {
    if (msg.includes('Invalid login credentials')) {
      return 'El correo electrónico o la contraseña son incorrectos.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'El correo electrónico aún no ha sido confirmado.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Error de conexión. Verificá tu conexión a internet o tus credenciales en el archivo .env.';
    }
    return `Error al iniciar sesión: ${msg}`;
  }
});
