// Authentication check
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'student') {
    window.location.href = 'login-signup.html';
}

// Helper function for authenticated fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        showError('No authentication token found. Please log in again.');
        setTimeout(() => {
            window.location.href = 'login-signup.html';
        }, 2000);
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
        setTimeout(() => {
            window.location.href = 'login-signup.html';
        }, 1000);
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return response.json();
}

// Show error or success message
function showError(message, color = '#dc3545') {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.color = color;
    setTimeout(() => { errorDiv.textContent = ''; }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = 'login-signup.html';
}

// Fetch and display courses
async function fetchCourses() {
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/courses?filter=approved');
        const courseList = document.getElementById('course-list');
        courseList.innerHTML = '';
        if (!data.length) {
            courseList.innerHTML = '<li>No courses available</li>';
            return;
        }
        data.forEach(course => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${course.title}</strong><br>
                    ${course.description || 'No description'}<br>
                    Price: $${course.price} | Duration: ${course.duration || 'N/A'} hours
                </div>
                <div>
                    <button onclick="enrollCourse('${course.id}')">Enroll</button>
                </div>
            `;
            courseList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('course-list').innerHTML = '<li>Error loading courses</li>';
    }
}

// Enroll in a course
async function enrollCourse(courseId) {
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/enrollments`, {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId })
        });
        fetchCourses();
        showError('Enrolled successfully!', '#28a745');
    } catch (err) {
        showError('Failed to enroll: ' + err.message);
    }
}

// Fetch and display certificates
async function fetchCertificates() {
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/certificates?user_id=' + user.id);
        const certificateList = document.getElementById('certificate-list');
        certificateList.innerHTML = '';
        if (!data.length) {
            certificateList.innerHTML = '<li>No certificates earned</li>';
            return;
        }
        data.forEach(cert => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${cert.course_title}</strong><br>
                    Issued: ${new Date(cert.issued_date).toLocaleDateString()}<br>
                    <a href="${cert.certificate_url}" target="_blank">View Certificate</a>
                </div>
            `;
            certificateList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('certificate-list').innerHTML = '<li>Error loading certificates</li>';
    }
}

// Fetch and display discussions
async function fetchDiscussions() {
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/discussion-forums?user_id=' + user.id);
        const discussionList = document.getElementById('discussion-list');
        discussionList.innerHTML = '';
        if (!data.length) {
            discussionList.innerHTML = '<li>No discussions available</li>';
            return;
        }
        data.forEach(forum => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${forum.title}</strong> for ${forum.course_title}<br>
                    Created: ${new Date(forum.created_at).toLocaleDateString()}
                </div>
                <div>
                    <button onclick="viewPosts('${forum.id}')">View Posts</button>
                </div>
            `;
            discussionList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('discussion-list').innerHTML = '<li>Error loading discussions</li>';
    }
}

// View discussion posts
async function viewPosts(forumId) {
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/discussion-forums/${forumId}/posts`);
        const discussionList = document.getElementById('discussion-list');
        discussionList.innerHTML = '<h3>Discussion Posts</h3>';
        if (!data.length) {
            discussionList.innerHTML += '<p>No posts available</p>';
            return;
        }
        data.forEach(post => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    ${post.content}<br>
                    By ${post.name} on ${new Date(post.created_at).toLocaleDateString()}
                </div>
            `;
            discussionList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('discussion-list').innerHTML = '<li>Error loading posts</li>';
    }
}

// Fetch and display events
async function fetchEvents() {
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/events?user_id=' + user.id);
        const eventList = document.getElementById('event-list');
        eventList.innerHTML = '';
        if (!data.length) {
            eventList.innerHTML = '<li>No events scheduled</li>';
            return;
        }
        data.forEach(event => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${event.title}</strong> for ${event.course_title}<br>
                    Starts: ${new Date(event.start_time).toLocaleString()}
                </div>
            `;
            eventList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('event-list').innerHTML = '<li>Error loading events</li>';
    }
}

// Fetch and display assessments
async function fetchAssessments() {
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/assessments?user_id=' + user.id);
        const assessmentList = document.getElementById('assessment-list');
        assessmentList.innerHTML = '';
        if (!data.length) {
            assessmentList.innerHTML = '<li>No assessments available</li>';
            return;
        }
        data.forEach(assessment => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${assessment.title}</strong> for ${assessment.course_title}<br>
                    Max Score: ${assessment.max_score} | Attempts: ${assessment.attempt_count}
                </div>
            `;
            assessmentList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('assessment-list').innerHTML = '<li>Error loading assessments</li>';
    }
}

// Fetch and display notifications
async function fetchNotifications() {
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/notifications?user_id=' + user.id);
        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = '';
        if (!data.length) {
            notificationList.innerHTML = '<li>No notifications</li>';
            return;
        }
        data.forEach(notification => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    ${notification.message}<br>
                    ${new Date(notification.created_at).toLocaleDateString()}
                </div>
            `;
            notificationList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('notification-list').innerHTML = '<li>Error loading notifications</li>';
    }
}

// Fetch and display progress
async function fetchProgress() {
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/course-completions?user_id=' + user.id);
        const progressList = document.getElementById('progress-list');
        progressList.innerHTML = '';
        if (!data.length) {
            progressList.innerHTML = '<li>No progress recorded</li>';
            return;
        }
        data.forEach(completion => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${completion.course_title}</strong><br>
                    Completed: ${new Date(completion.completion_date).toLocaleDateString()}<br>
                    Score: ${completion.score}%
                </div>
            `;
            progressList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('progress-list').innerHTML = '<li>Error loading progress</li>';
    }
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        const profile = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`);
        document.getElementById('dashboard-profile-picture').src = profile.profile_picture_url || '/assets/avatars/default.png';
        await Promise.all([
            fetchCourses(),
            fetchCertificates(),
            fetchDiscussions(),
            fetchEvents(),
            fetchAssessments(),
            fetchNotifications(),
            fetchProgress()
        ]);
    } catch (err) {
        showError('Failed to initialize dashboard: ' + err.message);
    }
}

// Run initialization
initializeDashboard();