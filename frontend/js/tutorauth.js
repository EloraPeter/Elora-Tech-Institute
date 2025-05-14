function toggleForms() {
    document.getElementById("loginForm").classList.toggle("active");
    document.getElementById("signupForm").classList.toggle("active");
    document.getElementById("loginError").textContent = "";
    document.getElementById("signupError").textContent = "";
}

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
    if (strength <= 40) {
        strengthBar.style.backgroundColor = '#ff4d4d';
        strengthText.textContent = 'Password Strength: Weak';
    } else if (strength <= 80) {
        strengthBar.style.backgroundColor = '#ffd700';
        strengthText.textContent = 'Password Strength: Moderate';
    } else {
        strengthBar.style.backgroundColor = '#28a745';
        strengthText.textContent = 'Password Strength: Strong';
    }
}

function socialLogin(provider) {
    window.location.href = `http://localhost:3000/api/auth/${provider}`;
}

function socialSignup(provider) {
    window.location.href = `http://localhost:3000/api/auth/${provider}`;
}

async function signup() {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const role = "instructor";
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
                role: data.user.role,
                bio: data.user.bio || '',
                expertise: data.user.expertise || ''
            }));
            window.location.href = 'tutor-dashboard.html';
        } else {
            loginError.textContent = data.error || 'Login failed';
        }
    } catch (err) {
        loginError.textContent = 'Network error. Please try again.';
    }
}