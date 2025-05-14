// Authentication check
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

// Fetch and display profile
async function fetchProfile() {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const profile = await response.json();
        document.getElementById('profile-name').textContent = profile.name;
        document.getElementById('profile-email').textContent = profile.email;
        document.getElementById('profile-bio').textContent = profile.bio || 'No bio yet';
        document.getElementById('profile-expertise').textContent = profile.expertise || 'No expertise listed';
        document.getElementById('profile-picture').src = profile.profile_picture_url || '/assets/avatars/default.png';
        document.getElementById('modal-profile-picture').src = profile.profile_picture_url || '/assets/avatars/default.png';
        document.getElementById('name').value = profile.name;
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('expertise').value = profile.expertise || '';
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
        const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, bio, expertise })
        });
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify({ ...user, name, bio, expertise }));
            fetchProfile();
            showError('Profile updated successfully!', '#28a745');
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to update profile');
        }
    } catch (err) {
        showError('Network error. Please try again.');
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
    const formData = new FormData();
    formData.append('profile_picture', file);
    try {
        const response = await fetch(`http://localhost:3000/api/users/${user.id}/profile-picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            updateProfilePicture(data.profile_picture_url);
            showError('Profile picture uploaded successfully!', '#28a745');
        } else {
            showError(data.error || 'Failed to upload picture');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    }
}

// Update profile picture
async function updateProfilePicture(url) {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ profile_picture_url: url })
        });
        if (response.ok) {
            document.getElementById('profile-picture').src = url;
            document.getElementById('modal-profile-picture').src = url;
            closePictureModal();
            showError('Profile picture updated successfully!', '#28a745');
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to update picture');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    }
}

// Logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = 'login-signup.html';
}

// Initialize
fetchProfile();