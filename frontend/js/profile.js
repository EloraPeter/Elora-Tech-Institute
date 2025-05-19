//Authentication check
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    window.location.href = 'login-signup.html';
}

// Show error or success message
function showError(message, color = '#dc3545') {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.color = color;
    setTimeout(() => { errorDiv.textContent = ''; }, 3000);
}

// Helper function for authenticated fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        showError('No authentication token found. Please log in again.');
        setTimeout(() => window.location.href = 'login-signup.html', 2000);
        throw new Error('No token');
    }
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        showError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => window.location.href = 'login-signup.html', 1000);
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return response.json();
}

// Back button redirection based on user role
document.getElementById('back-button')?.addEventListener('click', () => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        console.error('Failed to parse user data:', e);
    }

    if (!user) {
        window.location.href = 'login-signup.html';
    } else {
        switch (user.role) {
            case 'student':
                window.location.href = 'student-dashboard.html';
                break;
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'instructor':
                window.location.href = 'tutor-dashboard.html';
                break;
            default:
                window.location.href = 'index.html'; // Fallback for invalid roles
        }
    }
});

// Fetch and display profile
async function fetchProfile() {
    try {
        const profile = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`);
        document.getElementById('profile-name').textContent = profile.name;
        document.getElementById('profile-email').textContent = profile.email;
        document.getElementById('profile-bio').textContent = profile.bio || 'No bio yet';
        document.getElementById('profile-expertise').textContent = profile.expertise || 'No expertise listed';
        const pictureUrl = profile.profile_picture_url || 'images/avatars/default.jpg';
        document.getElementById('profile-picture').src = pictureUrl;
        document.getElementById('modal-profile-picture').src = pictureUrl;
        document.getElementById('name').value = profile.name;
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('expertise').value = profile.expertise || '';
        // Update localStorage
        localStorage.setItem('user', JSON.stringify({ ...user, ...profile }));
    } catch (err) {
        showError('Failed to load profile. Please try again.');
    }
}

// Update profile
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const bio = document.getElementById('bio').value;
    const expertise = document.getElementById('expertise').value;
    try {
        await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name, bio, expertise })
        });
        // Update localStorage
        localStorage.setItem('user', JSON.stringify({ ...user, name, bio, expertise }));
        await fetchProfile();
        showError('Profile updated successfully!', '#28a745');
    } catch (err) {
        showError(err.message || 'Failed to update profile');
    }
});

// Modal handling
function openPictureModal() {
    document.getElementById('pictureModal').style.display = 'flex';
}
function closePictureModal() {
    document.getElementById('pictureModal').style.display = 'none';
}

// Select default avatar
function selectAvatar(url) {
    updateProfilePicture(url);
}

// Upload picture from device
async function uploadPicture() {
    const fileInput = document.getElementById('picture-upload');
    const file = fileInput.files[0];
    if (!file) {
        showError('Please select a file to upload.');
        return;
    }
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
        showError('Please upload a valid image (JPEG, PNG, or JPG).');
        return;
    }
    if (file.size > maxSize) {
        showError('File size exceeds 5MB limit.');
        return;
    }
    const formData = new FormData();
    formData.append('profile_picture', file);
    try {
        showError('Uploading picture...', '#007bff');
        const data = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}/profile-picture`, {
            method: 'POST',
            body: formData
        });
        await updateProfilePicture(data.profile_picture_url);
        // Update localStorage
        localStorage.setItem('user', JSON.stringify({ ...user, profile_picture_url: data.profile_picture_url }));
        fileInput.value = ''; // Clear input
        showError('Profile picture uploaded successfully!', '#28a745');
    } catch (err) {
        showError(err.message || 'Failed to upload picture');
    }
}

// Update profile picture
async function updateProfilePicture(url) {
    try {
        await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ profile_picture_url: url })
        });
        document.getElementById('profile-picture').src = url;
        document.getElementById('modal-profile-picture').src = url;
        // Update localStorage
        localStorage.setItem('user', JSON.stringify({ ...user, profile_picture_url: url }));
        closePictureModal();
        showError('Profile picture updated successfully!', '#28a745');
    } catch (err) {
        showError(err.message || 'Failed to update picture');
    }
}

// Logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = 'login-signup.html';
}

// Event listeners
document.getElementById('profile-picture').addEventListener('click', openPictureModal);
document.getElementById('picture-upload').addEventListener('change', uploadPicture);
document.querySelectorAll('.avatar-option').forEach(avatar => {
    avatar.addEventListener('click', () => selectAvatar(avatar.src));
});

// Initialize
fetchProfile();