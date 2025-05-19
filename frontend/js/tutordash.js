// Check if user is logged in and is instructor
const user = JSON.parse(localStorage.getItem('user'));
console.log('User from localStorage:', user);
if (!user || user.role !== 'instructor') {
    console.error('Redirecting: No user or not an instructor');
    window.location.href = 'tutor-signup-login.html';
}
document.getElementById('userName').textContent = user.name;

// Helper function for authenticated fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found for URL:', url);
        showError('No authentication token found. Please log in again.');
        setTimeout(() => {
            window.location.href = 'tutor-signup-login.html';
        }, 2000);
        throw new Error('No token');
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            console.error(`401 Unauthorized for URL: ${url}`);
            showError('Session expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => {
                window.location.href = 'tutor-signup-login.html';
            }, 2000);
            throw new Error('Unauthorized');
        }
        if (response.status === 403) {
            console.error(`403 Forbidden for URL: ${url}`);
            showError('Access denied. Please check your permissions.');
            throw new Error('Forbidden');
        }
        if (!response.ok) {
            let errorData = { error: `HTTP error ${response.status}` };
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                const text = await response.text();
                console.error(`Non-JSON response for URL: ${url}`, text);
            }
            console.error(`Error ${response.status} for URL: ${url}`, errorData);
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        return response.json();
    } catch (err) {
        console.error(`Fetch error for URL: ${url}`, err);
        throw err;
    }
}

// Modal handling
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken")
    window.location.href = 'tutor-signup-login.html';
}

// Show error or success message
function showError(message, color = '#dc3545') {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.color = color;
    setTimeout(() => { errorDiv.textContent = ''; }, 3000);
}

// Upload profile picture
async function uploadProfilePicture(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profile_picture', file);
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}/profile-picture`, {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type to let FormData set it
        });
        document.getElementById('dashboard-profile-picture').src = data.profile_picture_url;
        showError('Profile picture updated successfully! 📸', '#28a745');
    } catch (err) {
        showError('Failed to upload profile picture: ' + err.message);
    }
}

// Create a course
async function createCourse() {
    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-description').value;
    const price = parseFloat(document.getElementById('course-price').value);
    const duration = parseInt(document.getElementById('course-duration').value);
    const course_type = document.getElementById('course-type').value;
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/courses', {
            method: 'POST',
            body: JSON.stringify({ title, description, instructor_id: user.id, price, duration, course_type })
        });
        fetchCourses();
        closeModal('createCourseModal');
        showError('Course created successfully! Awaiting approval.', '#28a745');
    } catch (err) {
        showError('Failed to create course: ' + err.message);
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
        const data = await fetchWithAuth(`http://localhost:3000/api/courses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ title, description, price, duration, course_type })
        });
        fetchCourses();
        closeModal('editCourseModal');
        showError('Course updated successfully!', '#28a745');
    } catch (err) {
        showError('Failed to update course: ' + err.message);
    }
}

// Delete a course
async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        try {
            const data = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}`, {
                method: 'DELETE'
            });
            fetchCourses();
            showError('Course deleted successfully!', '#28a745');
        } catch (err) {
            showError('Failed to delete course: ' + err.message);
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
        const data = await fetchWithAuth(`http://localhost:3000/api/courses/${course_id}/content`, {
            method: 'POST',
            body: JSON.stringify({ title, file_type, file_url })
        });
        closeModal('uploadContentModal');
        showError('Content uploaded successfully!', '#28a745');
    } catch (err) {
        showError('Failed to upload content: ' + err.message);
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
        const data = await fetchWithAuth('http://localhost:3000/api/notifications', {
            method: 'POST',
            body: JSON.stringify({ course_id, message, notification_type: 'course_notification' })
        });
        closeModal('notificationModal');
        showError('Notification sent successfully!', '#28a745');
    } catch (err) {
        showError('Failed to send notification: ' + err.message);
    }
}

// Update profile
async function updateProfile() {
    const name = document.getElementById('profile-name').value;
    const bio = document.getElementById('profile-bio').value;
    const expertise = document.getElementById('profile-expertise').value;
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name, bio, expertise })
        });
        localStorage.setItem('user', JSON.stringify({ ...user, name, bio, expertise }));
        document.getElementById('userName').textContent = name;
        closeModal('profileModal');
        showError('Profile updated successfully!', '#28a745');
    } catch (err) {
        showError('Failed to update profile: ' + err.message);
    }
}

// Fetch and display courses
async function fetchCourses() {
    try {
        console.log('Fetching courses...');
        const courses = await fetchWithAuth(`http://localhost:3000/api/courses?user_id=${user.id}`);
        console.log('Courses fetched:', courses);
        const courseList = document.getElementById('course-list');
        courseList.innerHTML = '';
        if (!Array.isArray(courses) || courses.length === 0) {
            courseList.innerHTML = '<li>No courses found</li>';
            return;
        }
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
        console.error('Error fetching courses:', err);
        document.getElementById('course-list').innerHTML = '<li>Error loading courses: ' + err.message + '</li>';
    }
}

// Fetch and display students
async function fetchStudents() {
    try {
        console.log('Fetching students...');
        const students = await fetchWithAuth(`http://localhost:3000/api/users?role=student`);
        console.log('Students fetched:', students);
        const studentList = document.getElementById('student-list');
        studentList.innerHTML = '';
        if (!Array.isArray(students)) {
            console.error('Students response is not an array:', students);
            studentList.innerHTML = '<li>No students found or access denied</li>';
            return;
        }
        if (students.length === 0) {
            studentList.innerHTML = '<li>No students found</li>';
            return;
        }
        students.forEach(student => {
            const li = document.createElement('li');
            li.innerHTML = `<div><strong>${student.name}</strong> (${student.email})</div>`;
            li.onclick = () => fetchStudentProgress(student.id);
            li.style.cursor = 'pointer';
            studentList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching students:', err);
        document.getElementById('student-list').innerHTML = '<li>Error loading students: ' + err.message + '</li>';
    }
}

// Fetch student progress for a course
async function fetchStudentProgress(studentId) {
    try {
        console.log('Fetching student progress for student:', studentId);
        const courses = await fetchWithAuth(`http://localhost:3000/api/courses?user_id=${user.id}`);
        let progressHtml = `<h3>Student Progress</h3>`;
        for (const course of courses) {
            const progress = await fetchWithAuth(`http://localhost:3000/api/courses/${course.id}/progress?user_id=${studentId}`);
            if (progress.progress !== undefined) {
                progressHtml += `
                    <p><strong>${course.title}</strong>: ${progress.progress}% complete</p>
                `;
            }
        }
        document.getElementById('student-list').innerHTML = progressHtml + '<button class="btn" onclick="fetchStudents()">Back to Students</button>';
    } catch (err) {
        console.error('Error fetching student progress:', err);
        showError('Error loading student progress: ' + err.message);
    }
}

// Fetch and display analytics
async function fetchAnalytics() {
    try {
        console.log('Fetching analytics...');
        const courses = await fetchWithAuth(`http://localhost:3000/api/courses?user_id=${user.id}`);
        const analyticsList = document.getElementById('analytics-list');
        analyticsList.innerHTML = '';
        if (!Array.isArray(courses) || courses.length === 0) {
            analyticsList.innerHTML = '<li>No analytics available</li>';
            return;
        }
        for (const course of courses) {
            const analytics = await fetchWithAuth(`http://localhost:3000/api/courses/${course.id}/analytics`);
            console.log(`Analytics for course ${course.id}:`, analytics);
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
        console.error('Error fetching analytics:', err);
        document.getElementById('analytics-list').innerHTML = '<li>Error loading analytics: ' + err.message + '</li>';
    }
}

// Fetch and display earnings
async function fetchEarnings() {
    try {
        console.log('Fetching earnings...');
        const data = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}/earnings`);
        console.log('Earnings fetched:', data);
        document.getElementById('totalEarnings').textContent = data.total_earnings.toFixed(2);
    } catch (err) {
        console.error('Error fetching earnings:', err);
        document.getElementById('totalEarnings').textContent = 'N/A';
        showError('Error loading earnings: ' + err.message);
    }
}






async function initializeDashboard() {
    try {
        const profile = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`);
        document.getElementById('dashboard-profile-picture').src = profile.profile_picture_url || 'images/avatars/default.jpg';
        await Promise.all([
            // Load data on page load
            fetchCourses(),
            fetchStudents(),
            fetchAnalytics(),
            fetchEarnings(),

        ]);
    } catch (err) {
        console.error('Error initializing dashboard:', err);
        showError('Failed to initialize dashboard: ' + err.message);
    }
}

// Run initialization
initializeDashboard();