// Set token from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
if (token) {
    document.getElementById('token').value = token;
} else {
    alert('Invalid or missing token. Please restart the password reset process.');
    window.location.href = '/forgot-password';
}

const passwordInput = document.getElementById('newPassword');
const strengthBar = document.createElement('div');
strengthBar.className = 'strength-bar';
const strengthText = document.createElement('div');
strengthText.className = 'strength-text';
passwordInput.parentElement.appendChild(strengthBar);
passwordInput.parentElement.appendChild(strengthText);

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    strengthBar.style.width = `${strength * 25}%`;
    strengthBar.style.backgroundColor = strength < 2 ? '#ff4d4d' : strength < 4 ? '#ffbf00' : '#28a745';
    strengthText.textContent = strength < 2 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong';
});

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Handle form submission
document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
        console.log(`FormData ${key}: ${value}`);
    }

    // Validate form data before sending
    const token = formData.get('token');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (!token || !password || !confirmPassword) {
        console.error('Missing form fields:', { token, password, confirmPassword });
        alert('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        const result = await response.json();
        if (result.redirect) {
            window.location.href = result.redirect;
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error('Submission error:', err);
        alert('Network error. Please try again.');
    }
});
