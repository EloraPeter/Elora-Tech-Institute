const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'student') {
    window.location.href = 'login-signup.html';
}
document.getElementById('userName').textContent = user.name;

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

// Modal handling
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'postDiscussionModal') {
        document.getElementById('discussion-forum-id').value = '';
        document.getElementById('discussion-content').value = '';
    } else if (modalId === 'submitAssessmentModal') {
        document.getElementById('assessment-id').value = '';
        document.getElementById('assessment-score').value = '';
    } else if (modalId === 'updateProfileModal') {
        document.getElementById('profile-user-id').value = '';
        document.getElementById('profile-name').value = '';
        document.getElementById('profile-bio').value = '';
        document.getElementById('profile-expertise').value = '';
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
    localStorage.removeItem('refreshToken');
    window.location.href = 'login-signup.html';
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

// Fetch enrolled courses
async function fetchCourses() {
    try {
        const response = await fetch(`http://localhost:3000/api/enrollments?user_id=${user.id}`);
        const enrollments = await response.json();
        const courseList = document.getElementById('course-list');
        courseList.innerHTML = '';
        if (!Array.isArray(enrollments) || enrollments.length === 0) {
            courseList.innerHTML = '<li>No enrolled courses. Enroll now! 📚</li>';
            return;
        }
        enrollments.forEach(enrollment => {
            const li = document.createElement('li');
            li.innerHTML = `
                        <div>
                            <strong>${enrollment.course_title}</strong><br>
                            ${enrollment.description || 'No description'}<br>
                            Price: $${enrollment.price} | Duration: ${enrollment.duration} hours | Type: ${enrollment.course_type}<br>
                            Progress: ${enrollment.progress || 0}%
                            <div class="progress-bar"><div style="width: ${enrollment.progress || 0}%"></div></div>
                        </div>
                        <div>
                            <button onclick="fetchCourseContent('${enrollment.course_id}')">View Content</button>
                        </div>
                    `;
            courseList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('course-list').innerHTML = '<li>Error loading courses: ' + err.message + '</li>';
        showError('Failed to load courses. Please try again.');
    }
}

// Fetch course content
async function fetchCourseContent(courseId) {
    try {
        const content = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}/content`);
        const resourceList = document.getElementById('resource-list');
        resourceList.innerHTML = '';
        if (content.length === 0) {
            resourceList.innerHTML = '<li>No resources available</li>';
        } else {
            content.forEach(item => {
                const li = document.createElement('li');
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || user.role !== 'student') {
                    window.location.href = 'login-signup.html';
                }
                document.getElementById('userName').textContent = user.name;

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

                // Modal handling
                function openModal(modalId) {
                    document.getElementById(modalId).style.display = 'flex';
                }
                function closeModal(modalId) {
                    document.getElementById(modalId).style.display = 'none';
                    if (modalId === 'postDiscussionModal') {
                        document.getElementById('discussion-forum-id').value = '';
                        document.getElementById('discussion-content').value = '';
                    } else if (modalId === 'submitAssessmentModal') {
                        document.getElementById('assessment-id').value = '';
                        document.getElementById('assessment-score').value = '';
                    } else if (modalId === 'updateProfileModal') {
                        document.getElementById('profile-user-id').value = '';
                        document.getElementById('profile-name').value = '';
                        document.getElementById('profile-bio').value = '';
                        document.getElementById('profile-expertise').value = '';
                    }
                }


                
                // Fetch course content
                async function fetchCourseContent(courseId) {
                    try {
                        const content = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}/content`);
                        const resourceList = document.getElementById('resource-list');
                        resourceList.innerHTML = '';
                        if (content.length === 0) {
                            resourceList.innerHTML = '<li>No resources available</li>';
                        } else {
                            content.forEach(item => {
                                const li = document.createElement('li');
                                li.innerHTML = `
                    <div>
                        <strong>${item.title}</strong><br>
                        Type: ${item.file_type} | <a href="${item.file_url}" target="_blank">View/Download</a>
                    </div>
                    <div></div>
                `;
                                resourceList.appendChild(li);
                            });
                        }
                        scrollToSection('resources');
                    } catch (err) {
                        document.getElementById('resource-list').innerHTML = '<li>Error loading resources</li>';
                        showError('Failed to load resources: ' + err.message);
                    }
                }

                // Fetch certificates
                async function fetchCertificates() {
                    try {
                        const response = await fetch(`http://localhost:3000/api/certificates?user_id=${user.id}`);
                        const certificates = await response.json();
                        const certificateList = document.getElementById('certificate-list');
                        certificateList.innerHTML = '';
                        if (!Array.isArray(certificates) || certificates.length === 0) {
                            certificateList.innerHTML = '<li>No certificates earned yet. Keep learning! 🌟</li>';
                            return;
                        }
                        certificates.forEach(cert => {
                            const li = document.createElement('li');
                            li.innerHTML = `
                        <div>
                            <strong>${cert.course_title}</strong><br>
                            Issued: ${new Date(cert.issued_date).toLocaleDateString()}<br>
                            Certificate ID: ${cert.certificate_id}
                        </div>
                        <div>
                            <button onclick="downloadCertificate('${cert.id}')">Download</button>
                        </div>
                    `;
                            certificateList.appendChild(li);
                        });
                    } catch (err) {
                        document.getElementById('certificate-list').innerHTML = '<li>Error loading certificates</li>';
                        showError('Failed to load certificates. Please try again.');
                    }
                }

                // Download certificate
                async function downloadCertificate(certificateId) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/certificates/${certificateId}/download`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `certificate_${certificateId}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                            showError('Certificate downloaded! 📜', '#28a745');
                        } else {
                            const data = await response.json();
                            showError(data.error || 'Failed to download certificate');
                        }
                    } catch (err) {
                        showError('Network error: ' + err.message);
                    }
                }

                // Fetch discussion forums
                async function fetchDiscussions() {
                    try {
                        const forums = await fetchWithAuth(`http://localhost:3000/api/discussion-forums?user_id=${user.id}`);
                        const discussionList = document.getElementById('discussion-list');
                        discussionList.innerHTML = '';
                        if (!Array.isArray(forums) || forums.length === 0) {
                            discussionList.innerHTML = '<li>No discussion forums available. Start one! 💬</li>';
                            return;
                        }
                        forums.forEach(forum => {
                            const li = document.createElement('li');
                            li.innerHTML = `
                <div>
                    <strong>${forum.title}</strong> for <strong>${forum.course_title}</strong><br>
                    Description: ${forum.description?.slice(0, 100) || 'No description'}...
                </div>
                <div>
                    <button onclick="fetchForumPosts('${forum.id}')">View Posts</button>
                    <button onclick="openPostDiscussion('${forum.id}')">Post</button>
                </div>
            `;
                            discussionList.appendChild(li);
                        });
                    } catch (err) {
                        document.getElementById('discussion-list').innerHTML = '<li>Error loading discussions</li>';
                        showError('Failed to load discussions: ' + err.message);
                    }
                }

                // Open post discussion modal
                function openPostDiscussion(forumId) {
                    document.getElementById('discussion-forum-id').value = forumId;
                    openModal('postDiscussionModal');
                }

                // Post to discussion
                async function postDiscussion() {
                    const forumId = document.getElementById('discussion-forum-id').value;
                    const content = document.getElementById('discussion-content').value;
                    try {
                        const data = await fetchWithAuth(`http://localhost:3000/api/discussion-forums/${forumId}/posts`, {
                            method: 'POST',
                            body: JSON.stringify({ user_id: user.id, content })
                        });
                        fetchForumPosts(forumId);
                        closeModal('postDiscussionModal');
                        showError('Post submitted successfully! 💬', '#28a745');
                    } catch (err) {
                        showError('Failed to submit post: ' + err.message);
                    }
                }

                // Fetch discussion posts
                async function fetchForumPosts(forumId) {
                    try {
                        const posts = await fetchWithAuth(`http://localhost:3000/api/discussion-forums/${forumId}/posts`);
                        const discussionList = document.getElementById('discussion-list');
                        discussionList.innerHTML = '<h3>Discussion Posts</h3>';
                        if (posts.length === 0) {
                            discussionList.innerHTML += '<li>No posts yet. Be the first! 💬</li>';
                        } else {
                            posts.forEach(post => {
                                const li = document.createElement('li');
                                li.innerHTML = `
                    <div>
                        <strong>${post.name}</strong> (${post.email})<br>
                        ${post.content.slice(0, 100)}...<br>
                        Posted: ${new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <div></div>
                `;
                                discussionList.appendChild(li);
                            });
                        }
                    } catch (err) {
                        document.getElementById('discussion-list').innerHTML = '<li>Error loading posts</li>';
                        showError('Failed to load posts: ' + err.message);
                    }
                }

                // Fetch events
                async function fetchEvents() {
                    try {
                        const events = await fetchWithAuth(`http://localhost:3000/api/events?user_id=${user.id}`);
                        const eventList = document.getElementById('event-list');
                        eventList.innerHTML = '';
                        if (!Array.isArray(events) || events.length === 0) {
                            eventList.innerHTML = '<li>No upcoming events. Stay tuned! 📅</li>';
                            return;
                        }
                        events.forEach(event => {
                            const li = document.createElement('li');
                            li.innerHTML = `
                <div>
                    <strong>${event.title}</strong> for <strong>${event.course_title}</strong><br>
                    Scheduled: ${new Date(event.start_time).toLocaleString()} (${event.timezone})<br>
                    URL: <a href="${event.event_url || '#'}" target="_blank">Join</a>
                </div>
                <div></div>
            `;
                            eventList.appendChild(li);
                        });
                    } catch (err) {
                        document.getElementById('event-list').innerHTML = '<li>Error loading events</li>';
                        showError('Failed to load events: ' + err.message);
                    }
                }

                // Fetch assessments
                async function fetchAssessments() {
                    try {
                        const assessments = await fetchWithAuth(`http://localhost:3000/api/assessments?user_id=${user.id}`);
                        const assessmentList = document.getElementById('assessment-list');
                        assessmentList.innerHTML = '';
                        if (!Array.isArray(assessments) || assessments.length === 0) {
                            assessmentList.innerHTML = '<li>No assessments available. Keep learning! 📝</li>';
                            return;
                        }
                        assessments.forEach(assessment => {
                            const li = document.createElement('li');
                            li.innerHTML = `
                <div>
                    <strong>${assessment.title}</strong> for <strong>${assessment.course_title}</strong><br>
                    Max Score: ${assessment.max_score} | Passing Score: ${assessment.passing_score}<br>
                    Attempts Left: ${assessment.max_attempts - (assessment.attempt_count || 0)}
                </div>
                <div>
                    <button onclick="openSubmitAssessment('${assessment.id}')">Submit Attempt</button>
                    <button onclick="fetchAssessmentAttempts('${assessment.id}')">View Attempts</button>
                </div>
            `;
                            assessmentList.appendChild(li);
                        });
                    } catch (err) {
                        document.getElementById('assessment-list').innerHTML = '<li>Error loading assessments</li>';
                        showError('Failed to load assessments: ' + err.message);
                    }
                }

                // Open submit assessment modal
                function openSubmitAssessment(assessmentId) {
                    document.getElementById('assessment-id').value = assessmentId;
                    openModal('submitAssessmentModal');
                }

                // Submit assessment attempt
                async function submitAssessment() {
                    const assessmentId = document.getElementById('assessment-id').value;
                    const score = document.getElementById('assessment-score').value;
                    try {
                        const data = await fetchWithAuth(`http://localhost:3000/api/assessments/${assessmentId}/attempts`, {
                            method: 'POST',
                            body: JSON.stringify({ user_id: user.id, score, attempt_number: 1 })
                        });
                        fetchAssessments();
                        closeModal('submitAssessmentModal');
                        showError('Assessment submitted successfully! 📝', '#28a745');
                    } catch (err) {
                        showError('Failed to submit assessment: ' + err.message);
                    }
                }

                // Fetch assessment attempts
                async function fetchAssessmentAttempts(assessmentId) {
                    try {
                        const attempts = await fetchWithAuth(`http://localhost:3000/api/assessments/${assessmentId}/attempts`);
                        const assessmentList = document.getElementById('assessment-list');
                        assessmentList.innerHTML = '<h3>Your Attempts</h3>';
                        if (attempts.length === 0) {
                            assessmentList.innerHTML += '<li>No attempts yet</li>';
                        } else {
                            attempts.forEach(attempt => {
                                const li = document.createElement('li');
                                li.innerHTML = `
                    <div>
                        <strong>Attempt ${attempt.attempt_number}</strong><br>
                        Score: ${attempt.score}<br>
                        Submitted: ${new Date(attempt.submitted_at).toLocaleDateString()}
                    </div>
                    <div></div>
                `;
                                assessmentList.appendChild(li);
                            });
                        }
                    } catch (err) {
                        document.getElementById('assessment-list').innerHTML = '<li>Error loading attempts</li>';
                        showError('Failed to load attempts: ' + err.message);
                    }
                }

                // Fetch notifications
                async function fetchNotifications() {
                    try {
                        const notifications = await fetchWithAuth(`http://localhost:3000/api/notifications?user_id=${user.id}`);
                        const notificationList = document.getElementById('notification-list');
                        notificationList.innerHTML = '';
                        if (!Array.isArray(notifications) || notifications.length === 0) {
                            notificationList.innerHTML = '<li>No notifications. Stay tuned! 🔔</li>';
                            return;
                        }
                        notifications.forEach(notification => {
                            const li = document.createElement('li');
                            li.innerHTML = `
                <div>
                    <strong>${notification.notification_type.replace('_', ' ')}</strong><br>
                    ${notification.message}<br>
                    ${notification.read ? 'Read' : 'Unread'} | ${new Date(notification.created_at).toLocaleDateString()}
                </div>
                <div>
                    ${!notification.read ? `<button onclick="markNotificationRead('${notification.id}')">Mark as Read</button>` : ''}
                </div>
            `;
                            notificationList.appendChild(li);
                        });
                    } catch (err) {
                        document.getElementById('notification-list').innerHTML = '<li>Error loading notifications</li>';
                        showError('Failed to load notifications: ' + err.message);
                    }
                }

                // Mark notification as read
                async function markNotificationRead(notificationId) {
                    try {
                        const data = await fetchWithAuth(`http://localhost:3000/api/notifications/${notificationId}/read`, {
                            method: 'PATCH'
                        });
                        fetchNotifications();
                        showError('Notification marked as read! 🔔', '#28a745');
                    } catch (err) {
                        showError('Failed to mark notification as read: ' + err.message);
                    }
                }

            

                // Fetch progress and render chart
                async function fetchProgress() {
                    try {
                        const completions = await fetchWithAuth(`http://localhost:3000/api/course-completions?user_id=${user.id}`);
                        const ctx = document.getElementById('progressChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: completions.map(c => c.course_title),
                                datasets: [{
                                    label: 'Completion Progress (%)',
                                    data: completions.map(c => c.score || 0),
                                    backgroundColor: 'rgba(75, 0, 130, 0.6)',
                                    borderColor: 'rgba(75, 0, 130, 1)',
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 100
                                    }
                                }
                            }
                        });
                    } catch (err) {
                        showError('Failed to load progress chart: ' + err.message);
                    }
                }

                // Initialize dashboard
                async function initializeDashboard() {
                    try {
                        const profile = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`);
                        document.getElementById('dashboard-profile-picture').src = profile.profile_picture_url || 'images/avatars/default.jpg';
                        await Promise.all([
                            fetchCourses(),
                            fetchCertificates(),
                            fetchDiscussions(),
                            fetchEvents(),
                            fetchAssessments(),
                            fetchNotifications(),
                            // fetchProfile(),
                            fetchProgress()
                        ]);
                    } catch (err) {
                        console.error('Error initializing dashboard:', err);
                        showError('Failed to initialize dashboard: ' + err.message);
                    }
                }

                // Run initialization
                initializeDashboard();

                // Add event listener for profile picture upload
                // document.getElementById('profile-picture-upload').addEventListener('change', uploadProfilePicture);
                li.innerHTML = `
                    <div>
                        <strong>${item.title}</strong><br>
                        Type: ${item.file_type} | <a href="${item.file_url}" target="_blank">View/Download</a>
                    </div>
                    <div></div>
                `;
                resourceList.appendChild(li);
            });
        }
        scrollToSection('resources');
    } catch (err) {
        document.getElementById('resource-list').innerHTML = '<li>Error loading resources</li>';
        showError('Failed to load resources: ' + err.message);
    }
}

// Fetch certificates
async function fetchCertificates() {
    try {
        const response = await fetch(`http://localhost:3000/api/certificates?user_id=${user.id}`);
        const certificates = await response.json();
        const certificateList = document.getElementById('certificate-list');
        certificateList.innerHTML = '';
        if (!Array.isArray(certificates) || certificates.length === 0) {
            certificateList.innerHTML = '<li>No certificates earned yet. Keep learning! 🌟</li>';
            return;
        }
        certificates.forEach(cert => {
            const li = document.createElement('li');
            li.innerHTML = `
                        <div>
                            <strong>${cert.course_title}</strong><br>
                            Issued: ${new Date(cert.issued_date).toLocaleDateString()}<br>
                            Certificate ID: ${cert.certificate_id}
                        </div>
                        <div>
                            <button onclick="downloadCertificate('${cert.id}')">Download</button>
                        </div>
                    `;
            certificateList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('certificate-list').innerHTML = '<li>Error loading certificates</li>';
        showError('Failed to load certificates. Please try again.');
    }
}

// Download certificate
async function downloadCertificate(certificateId) {
    try {
        const response = await fetch(`http://localhost:3000/api/certificates/${certificateId}/download`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate_${certificateId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showError('Certificate downloaded! 📜', '#28a745');
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to download certificate');
        }
    } catch (err) {
        showError('Network error: ' + err.message);
    }
}

// Fetch discussion forums
async function fetchDiscussions() {
    try {
        const forums = await fetchWithAuth(`http://localhost:3000/api/discussion-forums?user_id=${user.id}`);
        const discussionList = document.getElementById('discussion-list');
        discussionList.innerHTML = '';
        if (!Array.isArray(forums) || forums.length === 0) {
            discussionList.innerHTML = '<li>No discussion forums available. Start one! 💬</li>';
            return;
        }
        forums.forEach(forum => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${forum.title}</strong> for <strong>${forum.course_title}</strong><br>
                    Description: ${forum.description?.slice(0, 100) || 'No description'}...
                </div>
                <div>
                    <button onclick="fetchForumPosts('${forum.id}')">View Posts</button>
                    <button onclick="openPostDiscussion('${forum.id}')">Post</button>
                </div>
            `;
            discussionList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('discussion-list').innerHTML = '<li>Error loading discussions</li>';
        showError('Failed to load discussions: ' + err.message);
    }
}

// Open post discussion modal
function openPostDiscussion(forumId) {
    document.getElementById('discussion-forum-id').value = forumId;
    openModal('postDiscussionModal');
}

// Post to discussion
async function postDiscussion() {
    const forumId = document.getElementById('discussion-forum-id').value;
    const content = document.getElementById('discussion-content').value;
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/discussion-forums/${forumId}/posts`, {
            method: 'POST',
            body: JSON.stringify({ user_id: user.id, content })
        });
        fetchForumPosts(forumId);
        closeModal('postDiscussionModal');
        showError('Post submitted successfully! 💬', '#28a745');
    } catch (err) {
        showError('Failed to submit post: ' + err.message);
    }
}

// Fetch discussion posts
async function fetchForumPosts(forumId) {
    try {
        const posts = await fetchWithAuth(`http://localhost:3000/api/discussion-forums/${forumId}/posts`);
        const discussionList = document.getElementById('discussion-list');
        discussionList.innerHTML = '<h3>Discussion Posts</h3>';
        if (posts.length === 0) {
            discussionList.innerHTML += '<li>No posts yet. Be the first! 💬</li>';
        } else {
            posts.forEach(post => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${post.name}</strong> (${post.email})<br>
                        ${post.content.slice(0, 100)}...<br>
                        Posted: ${new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <div></div>
                `;
                discussionList.appendChild(li);
            });
        }
    } catch (err) {
        document.getElementById('discussion-list').innerHTML = '<li>Error loading posts</li>';
        showError('Failed to load posts: ' + err.message);
    }
}

// Fetch events
async function fetchEvents() {
    try {
        const events = await fetchWithAuth(`http://localhost:3000/api/events?user_id=${user.id}`);
        const eventList = document.getElementById('event-list');
        eventList.innerHTML = '';
        if (!Array.isArray(events) || events.length === 0) {
            eventList.innerHTML = '<li>No upcoming events. Stay tuned! 📅</li>';
            return;
        }
        events.forEach(event => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${event.title}</strong> for <strong>${event.course_title}</strong><br>
                    Scheduled: ${new Date(event.start_time).toLocaleString()} (${event.timezone})<br>
                    URL: <a href="${event.event_url || '#'}" target="_blank">Join</a>
                </div>
                <div></div>
            `;
            eventList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('event-list').innerHTML = '<li>Error loading events</li>';
        showError('Failed to load events: ' + err.message);
    }
}

// Fetch assessments
async function fetchAssessments() {
    try {
        const assessments = await fetchWithAuth(`http://localhost:3000/api/assessments?user_id=${user.id}`);
        const assessmentList = document.getElementById('assessment-list');
        assessmentList.innerHTML = '';
        if (!Array.isArray(assessments) || assessments.length === 0) {
            assessmentList.innerHTML = '<li>No assessments available. Keep learning! 📝</li>';
            return;
        }
        assessments.forEach(assessment => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${assessment.title}</strong> for <strong>${assessment.course_title}</strong><br>
                    Max Score: ${assessment.max_score} | Passing Score: ${assessment.passing_score}<br>
                    Attempts Left: ${assessment.max_attempts - (assessment.attempt_count || 0)}
                </div>
                <div>
                    <button onclick="openSubmitAssessment('${assessment.id}')">Submit Attempt</button>
                    <button onclick="fetchAssessmentAttempts('${assessment.id}')">View Attempts</button>
                </div>
            `;
            assessmentList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('assessment-list').innerHTML = '<li>Error loading assessments</li>';
        showError('Failed to load assessments: ' + err.message);
    }
}

// Open submit assessment modal
function openSubmitAssessment(assessmentId) {
    document.getElementById('assessment-id').value = assessmentId;
    openModal('submitAssessmentModal');
}

// Submit assessment attempt
async function submitAssessment() {
    const assessmentId = document.getElementById('assessment-id').value;
    const score = document.getElementById('assessment-score').value;
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/assessments/${assessmentId}/attempts`, {
            method: 'POST',
            body: JSON.stringify({ user_id: user.id, score, attempt_number: 1 })
        });
        fetchAssessments();
        closeModal('submitAssessmentModal');
        showError('Assessment submitted successfully! 📝', '#28a745');
    } catch (err) {
        showError('Failed to submit assessment: ' + err.message);
    }
}

// Fetch assessment attempts
async function fetchAssessmentAttempts(assessmentId) {
    try {
        const attempts = await fetchWithAuth(`http://localhost:3000/api/assessments/${assessmentId}/attempts`);
        const assessmentList = document.getElementById('assessment-list');
        assessmentList.innerHTML = '<h3>Your Attempts</h3>';
        if (attempts.length === 0) {
            assessmentList.innerHTML += '<li>No attempts yet</li>';
        } else {
            attempts.forEach(attempt => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>Attempt ${attempt.attempt_number}</strong><br>
                        Score: ${attempt.score}<br>
                        Submitted: ${new Date(attempt.submitted_at).toLocaleDateString()}
                    </div>
                    <div></div>
                `;
                assessmentList.appendChild(li);
            });
        }
    } catch (err) {
        document.getElementById('assessment-list').innerHTML = '<li>Error loading attempts</li>';
        showError('Failed to load attempts: ' + err.message);
    }
}

// Fetch notifications
async function fetchNotifications() {
    try {
        const notifications = await fetchWithAuth(`http://localhost:3000/api/notifications?user_id=${user.id}`);
        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = '';
        if (!Array.isArray(notifications) || notifications.length === 0) {
            notificationList.innerHTML = '<li>No notifications. Stay tuned! 🔔</li>';
            return;
        }
        notifications.forEach(notification => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${notification.notification_type.replace('_', ' ')}</strong><br>
                    ${notification.message}<br>
                    ${notification.read ? 'Read' : 'Unread'} | ${new Date(notification.created_at).toLocaleDateString()}
                </div>
                <div>
                    ${!notification.read ? `<button onclick="markNotificationRead('${notification.id}')">Mark as Read</button>` : ''}
                </div>
            `;
            notificationList.appendChild(li);
        });
    } catch (err) {
        document.getElementById('notification-list').innerHTML = '<li>Error loading notifications</li>';
        showError('Failed to load notifications: ' + err.message);
    }
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
        fetchNotifications();
        showError('Notification marked as read! 🔔', '#28a745');
    } catch (err) {
        showError('Failed to mark notification as read: ' + err.message);
    }
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
        fetchProfile();
        showError('Profile picture updated successfully! 📸', '#28a745');
    } catch (err) {
        showError('Failed to upload profile picture: ' + err.message);
    }
}

// Fetch progress and render chart
async function fetchProgress() {
    try {
        const completions = await fetchWithAuth(`http://localhost:3000/api/course-completions?user_id=${user.id}`);
        const ctx = document.getElementById('progressChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: completions.map(c => c.course_title),
                datasets: [{
                    label: 'Completion Progress (%)',
                    data: completions.map(c => c.score || 0),
                    backgroundColor: 'rgba(75, 0, 130, 0.6)',
                    borderColor: 'rgba(75, 0, 130, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    } catch (err) {
        showError('Failed to load progress chart: ' + err.message);
    }
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        const profile = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`);
        document.getElementById('dashboard-profile-picture').src = profile.profile_picture_url || 'images/avatars/default.jpg';
        await Promise.all([
            fetchCourses(),
            fetchCertificates(),
            fetchDiscussions(),
            fetchEvents(),
            fetchAssessments(),
            fetchNotifications(),
            // fetchProfile(),
            fetchProgress()
        ]);
    } catch (err) {
        console.error('Error initializing dashboard:', err);
        showError('Failed to initialize dashboard: ' + err.message);
    }
}

// Event listeners
document.getElementById('profile-picture-upload')?.addEventListener('change', uploadProfilePicture);
document.getElementById('profile-link')?.addEventListener('click', goToProfile);

// Run initialization
initializeDashboard();