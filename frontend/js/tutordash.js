// Check if user is logged in and is instructor
const user = JSON.parse(localStorage.getItem('user'));
console.log('User from localStorage:', user);
if (!user || user.role !== 'instructor') {
    window.location.href = 'tutor-signup-login.html';
}
document.getElementById('userName').textContent = user.name;

// Helper function for authenticated fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        showError('No authentication token found. Please log in again.');
        window.location.href = 'tutor-signup-login.html';
        throw new Error('No token');
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        showError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'tutor-signup-login.html';
        throw new Error('Unauthorized');
    }
    return response;
}

// Modal handling
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form fields
    if (modalId === 'createCourseModal') {
        document.getElementById('course-title').value = '';
        document.getElementById('course-description').value = '';
        document.getElementById('course-price').value = '';
        document.getElementById('course-duration').value = '';
        document.getElementById('course-type').value = 'live';
    } else if (modalId === 'editCourseModal') {
        document.getElementById('edit-course-id').value = '';
        document.getElementById('edit-course-title').value = '';
        document.getElementById('edit-course-description').value = '';
        document.getElementById('edit-course-price').value = '';
        document.getElementById('edit-course-duration').value = '';
        document.getElementById('edit-course-type').value = 'live';
    } else if (modalId === 'uploadContentModal') {
        document.getElementById('upload-course-id').value = '';
        document.getElementById('content-title').value = '';
        document.getElementById('content-type').value = 'video';
        document.getElementById('content-url').value = '';
    } else if (modalId === 'notificationModal') {
        document.getElementById('notification-course-id').value = '';
        document.getElementById('notification-message').value = '';
    } else if (modalId === 'profileModal') {
        document.getElementById('profile-name').value = user.name;
        document.getElementById('profile-bio').value = user.bio || '';
        document.getElementById('profile-expertise').value = user.expertise || '';
    }
}

// Scroll to section
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

// Logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'tutor-signup-login.html';
}

// Show error or success message
function showError(message, color = '#dc3545') {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.color = color;
    setTimeout(() => { errorDiv.textContent = ''; }, 3000);
}

// Create a course
async function createCourse() {
    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-description').value;
    const price = parseFloat(document.getElementById('course-price').value);
    const duration = parseInt(document.getElementById('course-duration').value);
    const course_type = document.getElementById('course-type').value;
    try {
        const response = await fetchWithAuth('http://localhost:3000/api/courses', {
            method: 'POST',
            body: JSON.stringify({ title, description, instructor_id: user.id, price, duration, course_type })
        });
        const data = await response.json();
        if (response.ok) {
            fetchCourses();
            closeModal('createCourseModal');
            showError('Course created successfully! Awaiting approval.', '#28a745');
        } else {
            showError(data.error || 'Failed to create course');
        }
    } catch (err) {
        showError('Network error or unauthorized. Please try again.');
    }
}

// Open edit course modal
function openEditCourse(course) {
    document.getElementById('edit-course-id').value = course.id;
    document.getElementById('edit-course-title').value = course.title;
    document.getElementById('edit-course-description').value = course.description;
    document.getElementById('edit-course-price').value = course.price;
    document.getElementById('edit-course-duration').value = course.duration || '';
    document.getElementById('edit-course-type').value = course.course_type;
    openModal('editCourseModal');
}

// Update a course
async function updateCourse() {
    const id = document.getElementById('edit-course-id').value;
    const title = document.getElementById('edit-course-title').value;
    const description = document.getElementById('edit-course-description').value;
    const price = parseFloat(document.getElementById('edit-course-price').value);
    const duration = parseInt(document.getElementById('edit-course-duration').value);
    const course_type = document.getElementById('edit-course-type').value;
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/courses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ title, description, price, duration, course_type })
        });
        const data = await response.json();
        if (response.ok) {
            fetchCourses();
            closeModal('editCourseModal');
            showError('Course updated successfully!', '#28a745');
        } else {
            showError(data.error || 'Failed to update course');
        }
    } catch (err) {
        showError('Network error or unauthorized. Please try again.');
    }
}

// Delete a course
async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        try {
            const response = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (response.ok) {
                fetchCourses();
                showError('Course deleted successfully!', '#28a745');
            } else {
                showError(data.error || 'Failed to delete course');
            }
        } catch (err) {
            showError('Network error or unauthorized. Please try again.');
        }
    }
}

// Open upload content modal
function openUploadContent(courseId) {
    document.getElementById('upload-course-id').value = courseId;
    openModal('uploadContentModal');
}

// Upload content
async function uploadContent() {
    const course_id = document.getElementById('upload-course-id').value;
    const title = document.getElementById('content-title').value;
    const file_type = document.getElementById('content-type').value;
    const file_url = document.getElementById('content-url').value;
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/courses/${course_id}/content`, {
            method: 'POST',
            body: JSON.stringify({ title, file_type, file_url })
        });
        const data = await response.json();
        if (response.ok) {
            closeModal('uploadContentModal');
            showError('Content uploaded successfully!', '#28a745');
        } else {
            showError(data.error || 'Failed to upload content');
        }
    } catch (err) {
        showError('Network error or unauthorized. Please try again.');
    }
}

// Open notification modal
function openNotification(courseId) {
    document.getElementById('notification-course-id').value = courseId;
    openModal('notificationModal');
}

// Send notification
async function sendNotification() {
    const course_id = document.getElementById('notification-course-id').value;
    const message = document.getElementById('notification-message').value;
    try {
        const response = await fetchWithAuth('http://localhost:3000/api/notifications', {
            method: 'POST',
            body: JSON.stringify({ course_id, message, notification_type: 'course_notification' })
        });
        const data = await response.json();
        if (response.ok) {
            closeModal('notificationModal');
            showError('Notification sent successfully!', '#28a745');
        } else {
            showError(data.error || 'Failed to send notification');
        }
    } catch (err) {
        showError('Network error or unauthorized. Please try again.');
    }
}

// Update profile
async function updateProfile() {
    const name = document.getElementById('profile-name').value;
    const bio = document.getElementById('profile-bio').value;
    const expertise = document.getElementById('profile-expertise').value;
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name, bio, expertise })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify({ ...user, name, bio, expertise }));
            document.getElementById('userName').textContent = name;
            closeModal('profileModal');
            showError('Profile updated successfully!', '#28a745');
        } else {
            showError(data.error || 'Failed to update profile');
        }
    } catch (err) {
        showError('Network error or unauthorized. Please try again.');
    }
}

// Fetch and display courses
async function fetchCourses() {
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/courses?user_id=${user.id}`);
        const courses = await response.json();
        const courseList = document.getElementById('course-list');
        courseList.innerHTML = '';
        courses.forEach(course => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${course.title}</strong><br>
                    ${course.description || 'No description'}<br>
                    Price: $${course.price} | Duration: ${course.duration || 'N/A'} hours | Type: ${course.course_type}<br>
                    Status: ${course.status}
                </div>
                <div>
                    ${course.status === 'pending' ? `
                        <button onclick='openEditCourse(${JSON.stringify(course)})'>Edit</button>
                        <button class="delete" onclick="deleteCourse('${course.id}')">Delete</button>
                    ` : ''}
                    ${course.status === 'approved' ? `
                        <button onclick="openUploadContent('${course.id}')">Upload Content</button>
                        <button onclick="openNotification('${course.id}')">Notify Students</button>
                    ` : ''}
                </div>
            `;
            courseList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('course-list').innerHTML = '<li>Error loading courses</li>';
    }
}

// Fetch and display students
async function fetchStudents() {
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/users?role=student`);
        const students = await response.json();
        const studentList = document.getElementById('student-list');
        studentList.innerHTML = '';
        students.forEach(student => {
            const li = document.createElement('li');
            li.innerHTML = `<div><strong>${student.name}</strong> (${student.email})</div>`;
            li.onclick = () => fetchStudentProgress(student.id);
            li.style.cursor = 'pointer';
            studentList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('student-list').innerHTML = '<li>Error loading students</li>';
    }
}

// Fetch student progress for a course
async function fetchStudentProgress(studentId) {
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/courses?user_id=${user.id}`);
        const courses = await response.json();
        let progressHtml = `<h3>Student Progress</h3>`;
        for (const course of courses) {
            const progressResponse = await fetchWithAuth(`http://localhost:3000/api/courses/${course.id}/progress?user_id=${studentId}`);
            const progress = await progressResponse.json();
            if (progress.progress !== undefined) {
                progressHtml += `
                    <p><strong>${course.title}</strong>: ${progress.progress}% complete</p>
                `;
            }
        }
        document.getElementById('student-list').innerHTML = progressHtml + '<button class="btn" onclick="fetchStudents()">Back to Students</button>';
    } catch (err) {
        showError('Error loading student progress');
    }
}

// Fetch and display analytics
async function fetchAnalytics() {
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/courses?user_id=${user.id}`);
        const courses = await response.json();
        const analyticsList = document.getElementById('analytics-list');
        analyticsList.innerHTML = '';
        for (const course of courses) {
            const analyticsResponse = await fetchWithAuth(`http://localhost:3000/api/courses/${course.id}/analytics`);
            const analytics = await analyticsResponse.json();
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${course.title}</strong><br>
                    Enrollments: ${analytics.enrollment_count}<br>
                    Average Rating: ${analytics.avg_rating ? analytics.avg_rating.toFixed(1) : 'N/A'}/5 (${analytics.review_count || 0} reviews)<br>
                    Completions: ${analytics.completion_count}
                </div>
            `;
            analyticsList.appendChild(li);
        }
    } catch (err) {
        document.getElementById('analytics-list').innerHTML = '<li>Error loading analytics</li>';
    }
}

// Fetch and display earnings
async function fetchEarnings() {
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/instructors/${user.id}/earnings`);
        const data = await response.json();
        document.getElementById('totalEarnings').textContent = data.total_earnings.toFixed(2);
    } catch (err) {
        showError('Error loading earnings');
    }
}

// Load data on page load
fetchCourses();
fetchStudents();
fetchAnalytics();
fetchEarnings();