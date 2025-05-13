function toggleForms() {
    document.getElementById("loginForm").classList.toggle("active");
    document.getElementById("signupForm").classList.toggle("active");
    document.getElementById("loginError").textContent = "";
    document.getElementById("signupError").textContent = "";
}

async function signup() {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const role = "instructor";
    const signupError = document.getElementById("signupError");

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