// Forgot Password Toggle
document.querySelector('a[href="/forgot-password"]').addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('#loginForm').style.display = 'none';
  document.querySelector('#forgot-password-section').style.display = 'block';
});

/// Forgot Password Form Submission
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('forgotPasswordEmail').value;
    const errorElement = document.getElementById('forgotPasswordError');
    const loadingOverlay = document.getElementById('loading-overlay');
    const submitButton = document.querySelector('#forgot-password-form button[type="submit"]');

    // Clear previous error
    errorElement.textContent = '';

    // Validate email (basic check)
    if (!email) {
        errorElement.textContent = 'Please enter a valid email address.';
        return;
    }

    // Show loading animation and disable submit button
    loadingOverlay.style.display = 'flex';
    submitButton.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await response.json();

        if (result.redirect) {
            // Redirect to OTP page
            window.location.href = result.redirect;
            // Spinner will disappear automatically due to page redirect
        } else {
            // Display error and hide loading animation
            errorElement.textContent = result.message || 'An error occurred.';
            loadingOverlay.style.display = 'none';
            submitButton.disabled = false;
        }
    } catch (err) {
        // Handle network or other errors
        errorElement.textContent = 'Network error. Please try again.';
        loadingOverlay.style.display = 'none';
        submitButton.disabled = false;
    }
});

// Toggle between login and signup forms
function toggleForms() {
  document.getElementById('loginForm').classList.toggle('active');
  document.getElementById('signupForm').classList.toggle('active');
  document.getElementById('newPassword').classList.toggle('active');
  document.getElementById('confirmPassword').classList.toggle('active');
  document.getElementById('loginError').textContent = '';
  document.getElementById('signupError').textContent = '';
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = '<i class="fa-solid fa-eye"></i>';
  } else {
    input.type = 'password';
    button.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
  }
}

// Check password strength for signup
function checkPasswordStrength() {
  const password = document.getElementById('signupPassword').value;
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  let strength = 0;

  if (password.length >= 8) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;

  strengthBar.style.width = `${strength}%`;
  if (strength <= 30) {
    strengthBar.style.backgroundColor = '#ff4d4d';
    strengthText.textContent = 'Password Strength: Weak';
  } else if (strength <= 70) {
    strengthBar.style.backgroundColor = '#ffd700';
    strengthText.textContent = 'Password Strength: Moderate';
  } else {
    strengthBar.style.backgroundColor = '#28a745';
    strengthText.textContent = 'Password Strength: Strong';
  }
}

// Social login and signup
function socialLogin(provider) {
  window.location.href = `http://localhost:3000/api/auth/${provider}`;
}

function socialSignup(provider) {
  window.location.href = `http://localhost:3000/api/auth/${provider}`;
}

// Signup function
async function signup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("signupRole").value;
  const signupError = document.getElementById("signupError");

  if (password.length < 8) {
    signupError.textContent = 'Password must be at least 8 characters long';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (res.ok) {
      signupError.textContent = 'Registration successful! Please log in.';
      signupError.style.color = '#28a745';
      toggleForms();
    } else {
      signupError.textContent = data.error || 'Registration failed';
    }
  } catch (err) {
    signupError.textContent = 'Network error. Please try again.';
  }
}

// Login function
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const loginError = document.getElementById("loginError");

  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      }));
      window.location.href = 'admin-dashboard.html';
    } else {
      loginError.textContent = data.error || 'Login failed';
    }
  } catch (err) {
    loginError.textContent = 'Network error. Please try again.';
  }
}