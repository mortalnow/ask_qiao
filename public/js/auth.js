/**
 * Login Page Handler - Supports both Login and Registration
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to chat
  if (window.API?.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Tab switching
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.login-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active form
      forms.forEach(f => {
        f.classList.remove('active');
        if (f.dataset.form === targetTab) {
          f.classList.add('active');
        }
      });
      
      // Clear errors
      document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    });
  });

  // Login Form
  const loginForm = document.getElementById('login-form');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const loginSubmitBtn = loginForm.querySelector('button[type="submit"]');
  const loginErrorMessage = document.getElementById('login-error-message');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    // Validate
    if (!username || !password) {
      showLoginError('Please fill in all fields');
      return;
    }

    if (username.length < 2 || username.length > 30) {
      showLoginError('Username must be 2-30 characters');
      return;
    }

    // Submit
    setLoginLoading(true);
    clearLoginError();

    try {
      await window.API.login(username, password);
      window.location.href = '/';
    } catch (err) {
      showLoginError(err.message);
      setLoginLoading(false);
    }
  });

  // Register Form
  const registerForm = document.getElementById('register-form');
  const codeInput = document.getElementById('invite-code');
  const registerUsername = document.getElementById('register-username');
  const registerPassword = document.getElementById('register-password');
  const registerSubmitBtn = registerForm.querySelector('button[type="submit"]');
  const registerErrorMessage = document.getElementById('register-error-message');

  // Auto-format invite code input
  codeInput.addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Add hyphen after 6 characters
    if (value.length > 6) {
      value = value.slice(0, 6) + '-' + value.slice(6, 12);
    }
    
    e.target.value = value;
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = codeInput.value.trim();
    const username = registerUsername.value.trim();
    const password = registerPassword.value;

    // Validate
    if (!code || !username || !password) {
      showRegisterError('Please fill in all fields');
      return;
    }

    if (!/^[A-Z0-9]{6}-[A-Z0-9]{6}$/.test(code)) {
      showRegisterError('Invalid invite code format');
      return;
    }

    if (username.length < 2 || username.length > 30) {
      showRegisterError('Username must be 2-30 characters');
      return;
    }

    if (password.length < 6) {
      showRegisterError('Password must be at least 6 characters');
      return;
    }

    // Submit
    setRegisterLoading(true);
    clearRegisterError();

    try {
      await window.API.verifyInviteCode(code, username, password);
      window.location.href = '/';
    } catch (err) {
      showRegisterError(err.message);
      setRegisterLoading(false);
    }
  });

  function showLoginError(message) {
    loginErrorMessage.textContent = message;
  }

  function clearLoginError() {
    loginErrorMessage.textContent = '';
  }

  function setLoginLoading(loading) {
    loginSubmitBtn.disabled = loading;
    loginSubmitBtn.classList.toggle('loading', loading);
  }

  function showRegisterError(message) {
    registerErrorMessage.textContent = message;
  }

  function clearRegisterError() {
    registerErrorMessage.textContent = '';
  }

  function setRegisterLoading(loading) {
    registerSubmitBtn.disabled = loading;
    registerSubmitBtn.classList.toggle('loading', loading);
  }
});
