// Authentication check
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') {
    console.error('Redirecting: No user or not an admin');
    window.location.href = 'admin-signup-login.html';
}
document.getElementById('userName').textContent = user.name;

// Helper function for authenticated fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found for URL:', url);
        showError('No authentication token found. Please log in again.');
        setTimeout(() => {
            window.location.href = 'admin-signup-login.html';
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
                window.location.href = 'admin-signup-login.html';
            }, 1000);
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
    if (modalId === 'notificationModal') {
        document.getElementById('notification-recipient').value = '';
        document.getElementById('notification-type').value = 'general';
        document.getElementById('notification-message').value = '';
    } else if (modalId === 'promoteUserModal') {
        document.getElementById('promote-user-id').value = '';
        document.getElementById('promote-role').value = 'student';
    } else if (modalId === 'reviewSubmissionModal') {
        document.getElementById('submission-id').value = '';
        document.getElementById('submission-status').value = 'approved';
        document.getElementById('submission-comments').value = '';
    } else if (modalId === 'issueCertificateModal') {
        document.getElementById('certificate-user-id').value = '';
        document.getElementById('certificate-course-id').value = '';
        document.getElementById('certificate-user-name').value = '';
        document.getElementById('certificate-course-title').value = '';
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
    localStorage.removeItem("refreshToken");
    window.location.href = 'admin-signup-login.html';
}

// Show error or success message
function showError(message, color = '#dc3545') {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.color = color;
    setTimeout(() => { errorDiv.textContent = ''; }, 3000);
}

// Approve a course
async function approveCourse(courseId) {
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}/approve`, {
            method: 'PATCH'
        });
        fetchCourses();
        showError('Course Approved! Empowering Learners! 🎉', '#28a745');
    } catch (err) {
        console.error('Error approving course:', err);
        showError('Failed to approve course: ' + err.message);
    }
}

// Reject a course
async function rejectCourse(courseId) {
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}/reject`, {
            method: 'PATCH'
        });
        fetchCourses();
        showError('Course rejected successfully!', '#28a745');
    } catch (err) {
        console.error('Error rejecting course:', err);
        showError('Failed to reject course: ' + err.message);
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
            console.error('Error deleting course:', err);
            showError('Failed to delete course: ' + err.message);
        }
    }
}

// Review course submission
async function reviewSubmission() {
    const id = document.getElementById('submission-id').value;
    const status = document.getElementById('submission-status').value;
    const admin_comments = document.getElementById('submission-comments').value;
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/course-submissions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, admin_comments })
        });
        fetchSubmissions();
        closeModal('reviewSubmissionModal');
        showError(`Submission ${status}! Feedback sent.`, '#28a745');
    } catch (err) {
        console.error('Error reviewing submission:', err);
        showError('Failed to review submission: ' + err.message);
    }
}

// Delete a user
async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const data = await fetchWithAuth(`http://localhost:3000/api/users/${userId}`, {
                method: 'DELETE'
            });
            fetchUsers();
            showError('User deleted successfully!', '#28a745');
        } catch (err) {
            console.error('Error deleting user:', err);
            showError('Failed to delete user: ' + err.message);
        }
    }
}

// Open promote user modal
function openPromoteUser(userId, currentRole) {
    document.getElementById('promote-user-id').value = userId;
    document.getElementById('promote-role').value = currentRole;
    openModal('promoteUserModal');
}

// Promote a user
async function promoteUser() {
    const userId = document.getElementById('promote-user-id').value;
    const role = document.getElementById('promote-role').value;
    try {
        const data = await fetchWithAuth(`http://localhost:3000/api/users/${userId}/promote`, {
            method: 'PATCH',
            body: JSON.stringify({ role })
        });
        fetchUsers();
        closeModal('promoteUserModal');
        showError('User role updated successfully!', '#28a745');
    } catch (err) {
        console.error('Error promoting user:', err);
        showError('Failed to update user role: ' + err.message);
    }
}

// Send notification
async function sendNotification() {
    const recipient_type = document.getElementById('notification-recipient').value;
    const notification_type = document.getElementById('notification-type').value;
    const message = document.getElementById('notification-message').value;
    if (!recipient_type || !notification_type || !message) {
        showError('Recipient type, notification type, and message are required');
        return;
    }
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/notifications', {
            method: 'POST',
            body: JSON.stringify({ message, recipient_type, notification_type })
        });
        closeModal('notificationModal');
        fetchNotifications();
        alert('Announcement sent successfully! 📣', '#28a745');
    } catch (err) {
        console.error('Error sending notification:', err);
        showError('Failed to send announcement: ' + err.message);
    }
}

// Delete course content
async function deleteContent(courseId, contentId) {
    if (confirm('Are you sure you want to delete this content?')) {
        try {
            const data = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}/content/${contentId}`, {
                method: 'DELETE'
            });
            fetchCourseContent(courseId);
            showError('Content deleted successfully!', '#28a745');
        } catch (err) {
            console.error('Error deleting content:', err);
            showError('Failed to delete content: ' + err.message);
        }
    }
}

// Open issue certificate modal
function openIssueCertificate(userId, userName, courseId, courseTitle) {
    document.getElementById('certificate-user-id').value = userId;
    document.getElementById('certificate-course-id').value = courseId;
    document.getElementById('certificate-user-name').value = userName;
    document.getElementById('certificate-course-title').value = courseTitle;
    openModal('issueCertificateModal');
}

// Issue certificate
async function issueCertificate() {
    const user_id = document.getElementById('certificate-user-id').value;
    const course_id = document.getElementById('certificate-course-id').value;
    try {
        const data = await fetchWithAuth('http://localhost:3000/api/certificates', {
            method: 'POST',
            body: JSON.stringify({ user_id, course_id })
        });
        fetchCertificates();
        closeModal('issueCertificateModal');
        showError('Certificate issued successfully! 🎓', '#28a745');
    } catch (err) {
        console.error('Error issuing certificate:', err);
        showError('Failed to issue certificate: ' + err.message);
    }
}

// Revoke certificate
async function revokeCertificate(certificateId) {
    if (confirm('Are you sure you want to revoke this certificate?')) {
        try {
            const data = await fetchWithAuth(`http://localhost:3000/api/certificates/${certificateId}`, {
                method: 'DELETE'
            });
            fetchCertificates();
            showError('Certificate revoked successfully!', '#28a745');
        } catch (err) {
            console.error('Error revoking certificate:', err);
            showError('Failed to revoke certificate: ' + err.message);
        }
    }
}

// Download certificate
async function downloadCertificate(certificateId) {
    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/certificates/${certificateId}/download`);
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
            showError('Certificate downloaded successfully! 📜', '#28a745');
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to download certificate');
        }
    } catch (err) {
        console.error('Error downloading certificate:', err);
        showError('Failed to download certificate: ' + err.message);
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            const data = await fetchWithAuth(`http://localhost:3000/api/events/${eventId}`, {
                method: 'DELETE'
            });
            fetchEvents();
            showError('Event deleted successfully!', '#28a745');
        } catch (err) {
            console.error('Error deleting event:', err);
            showError('Failed to delete event: ' + err.message);
        }
    }
}

// Delete discussion post
async function deletePost(postId, forumId) {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            const data = await fetchWithAuth(`http://localhost:3000/api/discussion-posts/${postId}`, {
                method: 'DELETE'
            });
            fetchForumPosts(forumId);
            showError('Post deleted successfully!', '#28a745');
        } catch (err) {
            console.error('Error deleting post:', err);
            showError('Failed to delete post: ' + err.message);
        }
    }
}

// Fetch and display courses
async function fetchCourses() {
    try {
        console.log('Fetching courses...');
        const data = await fetchWithAuth('http://localhost:3000/api/courses?filter=all');
        console.log('Courses fetched:', data);
        const courseList = document.getElementById('course-list');
        courseList.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            courseList.innerHTML = '<li>No courses found</li>';
            return;
        }
        data.forEach(course => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${course.title}</strong> by ${course.instructor_name || 'Unknown'}<br>
                    ${course.description || 'No description'}<br>
                    Price: $${course.price} | Duration: ${course.duration || 'N/A'} hours | Type: ${course.course_type}<br>
                    Status: ${course.status}
                </div>
                <div>
                    ${course.status === 'pending' ? `
                        <button onclick="approveCourse('${course.id}')">Approve</button>
                        <button class="reject" onclick="rejectCourse('${course.id}')">Reject</button>
                    ` : ''}
                    <button class="delete" onclick="deleteCourse('${course.id}')">Delete</button>
                    <button onclick="fetchCourseContent('${course.id}')">View Content</button>
                </div>
            `;
            courseList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        document.getElementById('course-list').innerHTML = '<li>Error loading courses: ' + err.message + '</li>';
    }
}

// Fetch and display course submissions
async function fetchSubmissions() {
    try {
        console.log('Fetching submissions...');
        const data = await fetchWithAuth('http://localhost:3000/api/course-submissions');
        console.log('Submissions fetched:', data);
        const submissionList = document.getElementById('submission-list');
        submissionList.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            submissionList.innerHTML = '<li>No submissions found</li>';
            return;
        }
        data.forEach(sub => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${sub.course_title}</strong> by ${sub.instructor_name}<br>
                    Outline: ${sub.outline.slice(0, 100)}...<br>
                    Status: ${sub.status} ${sub.admin_comments ? `<br>Comments: ${sub.admin_comments}` : ''}
                </div>
                <div>
                    ${sub.status === 'pending' ? `
                        <button onclick="openReviewSubmission('${sub.id}')">Review</button>
                    ` : ''}
                </div>
            `;
            submissionList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching submissions:', err);
        document.getElementById('submission-list').innerHTML = '<li>Error loading submissions: ' + err.message + '</li>';
    }
}

// Open review submission modal
function openReviewSubmission(submissionId) {
    document.getElementById('submission-id').value = submissionId;
    openModal('reviewSubmissionModal');
}

// Fetch and display users
async function fetchUsers() {
    try {
        console.log('Fetching users...');
        const data = await fetchWithAuth('http://localhost:3000/api/users');
        console.log('Users fetched:', data);
        const userList = document.getElementById('user-list');
        userList.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            userList.innerHTML = '<li>No users found</li>';
            return;
        }
        data.forEach(u => {
            if (!u.id || !u.name || !u.email || !u.role) {
                console.warn('Invalid user data:', u);
                return;
            }
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${u.name}</strong> (${u.email})<br>
                    Role: ${u.role} ${u.bio ? `<br>Bio: ${u.bio.slice(0, 50)}...` : ''}
                </div>
                <div>
                    <button onclick="openPromoteUser('${u.id}', '${u.role}')">Promote</button>
                    <button class="delete" onclick="deleteUser('${u.id}')">Delete</button>
                </div>
            `;
            userList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        document.getElementById('user-list').innerHTML = '<li>Error loading users: ' + err.message + '</li>';
    }
}

// Fetch and display course content
async function fetchCourseContent(courseId) {
    try {
        console.log('Fetching course content for course:', courseId);
        const data = await fetchWithAuth(`http://localhost:3000/api/courses/${courseId}/content`);
        console.log('Course content fetched:', data);
        const contentList = document.getElementById('content-list');
        contentList.innerHTML = `<h3>Content for Course</h3>`;
        if (!Array.isArray(data) || data.length === 0) {
            contentList.innerHTML += '<p>No content available</p>';
        } else {
            data.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${item.title}</strong><br>
                        Type: ${item.file_type} | URL: <a href="${item.file_url}" target="_blank">View</a>
                    </div>
                    <div>
                        <button class="delete" onclick="deleteContent('${courseId}', '${item.id}')">Delete</button>
                    </div>
                `;
                contentList.appendChild(li);
            });
        }
    } catch (err) {
        console.error('Error fetching course content:', err);
        document.getElementById('content-list').innerHTML = '<li>Error loading content: ' + err.message + '</li>';
    }
}

// Fetch and display certificates
async function fetchCertificates() {
    try {
        console.log('Fetching certificates...');
        const certificatesData = await fetchWithAuth('http://localhost:3000/api/certificates');
        const completionsData = await fetchWithAuth('http://localhost:3000/api/course-completions');
        console.log('Certificates fetched:', certificatesData);
        console.log('Completions fetched:', completionsData);
        const certificateList = document.getElementById('certificate-list');
        const userFilter = document.getElementById('certificate-user-filter').value.toLowerCase();
        const courseFilter = document.getElementById('certificate-course-filter').value.toLowerCase();

        certificateList.innerHTML = '';

        // Filter and display course completions eligible for certificates
        completionsData
            .filter(completion =>
                (!userFilter || completion.user_name.toLowerCase().includes(userFilter)) &&
                (!courseFilter || completion.course_title.toLowerCase().includes(courseFilter))
            )
            .forEach(completion => {
                const hasCertificate = certificatesData.find(cert =>
                    cert.user_id === completion.user_id && cert.course_id === completion.course_id
                );
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${completion.user_name}</strong> completed <strong>${completion.course_title}</strong><br>
                        Completion Date: ${new Date(completion.completion_date).toLocaleDateString()}<br>
                        Certificate: ${hasCertificate ? 'Issued' : 'Not Issued'}
                    </div>
                    <div>
                        ${!hasCertificate ? `
                            <button onclick="openIssueCertificate('${completion.user_id}', '${completion.user_name}', '${completion.course_id}', '${completion.course_title}')">Issue</button>
                        ` : `
                            <button onclick="downloadCertificate('${hasCertificate.id}')">Download</button>
                            <button class="delete" onclick="revokeCertificate('${hasCertificate.id}')">Revoke</button>
                        `}
                    </div>
                `;
                certificateList.appendChild(li);
            });
    } catch (err) {
        console.error('Error fetching certificates:', err);
        document.getElementById('certificate-list').innerHTML = '<li>Error loading certificates: ' + err.message + '</li>';
        showError('Failed to load certificates: ' + err.message);
    }
}

// Filter certificates on input
function setupCertificateFilters() {
    const userFilter = document.getElementById('certificate-user-filter');
    const courseFilter = document.getElementById('certificate-course-filter');
    if (userFilter && courseFilter) {
        userFilter.addEventListener('input', fetchCertificates);
        courseFilter.addEventListener('input', fetchCertificates);
    } else {
        console.warn('Certificate filter elements not found');
    }
}

// Fetch and display events
async function fetchEvents() {
    try {
        console.log('Fetching events...');
        const data = await fetchWithAuth('http://localhost:3000/api/events?user_id=' + user.id);
        console.log('Events fetched:', data);
        const eventList = document.getElementById('event-list');
        eventList.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            eventList.innerHTML = '<li>No events found</li>';
            return;
        }
        data.forEach(event => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${event.title}</strong> for <strong>${event.course_title}</strong><br>
                    Scheduled: ${new Date(event.start_time).toLocaleString()}<br>
                    URL: <a href="${event.google_calendar_event_id ? `https://calendar.google.com/calendar/r/eventedit/${event.google_calendar_event_id}` : '#'}" target="_blank">Join</a>
                </div>
                <div>
                    <button class="delete" onclick="deleteEvent('${event.id}')">Delete</button>
                </div>
            `;
            eventList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching events:', err);
        document.getElementById('event-list').innerHTML = '<li>Error loading events: ' + err.message + '</li>';
    }
}

// Fetch and display discussion forums
async function fetchForums() {
    try {
        console.log('Fetching forums...');
        const data = await fetchWithAuth('http://localhost:3000/api/discussion-forums?user_id=' + user.id);
        console.log('Forums fetched:', data);
        const forumList = document.getElementById('forum-list');
        forumList.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            forumList.innerHTML = '<li>No forums found</li>';
            return;
        }
        data.forEach(forum => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${forum.title}</strong> for <strong>${forum.course_title}</strong><br>
                    Created: ${new Date(forum.created_at).toLocaleDateString()}
                </div>
                <div>
                    <button onclick="fetchForumPosts('${forum.id}')">View Posts</button>
                </div>
            `;
            forumList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching forums:', err);
        document.getElementById('forum-list').innerHTML = '<li>Error loading forums: ' + err.message + '</li>';
    }
}

// Fetch and display discussion posts
async function fetchForumPosts(forumId) {
    try {
        console.log('Fetching posts for forum:', forumId);
        const data = await fetchWithAuth(`http://localhost:3000/api/discussion-forums/${forumId}/posts`);
        console.log('Posts fetched:', data);
        const forumList = document.getElementById('forum-list');
        forumList.innerHTML = `<h3>Posts in Forum</h3>`;
        if (!Array.isArray(data) || data.length === 0) {
            forumList.innerHTML += '<p>No posts available</p>';
        } else {
            data.forEach(post => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${post.name}</strong> (${post.email})<br>
                        Content: ${post.content.slice(0, 100)}...<br>
                        Posted: ${new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <div>
                        <button class="delete" onclick="deletePost('${post.id}', '${forumId}')">Delete</button>
                    </div>
                `;
                forumList.appendChild(li);
            });
        }
    } catch (err) {
        console.error('Error fetching posts:', err);
        document.getElementById('forum-list').innerHTML = '<li>Error loading posts: ' + err.message + '</li>';
    }
}

// Fetch and display assessments
async function fetchAssessments() {
    try {
        console.log('Fetching assessments...');
        const data = await fetchWithAuth('http://localhost:3000/api/assessments?user_id=' + user.id);
        console.log('Assessments fetched:', data);
        const assessmentList = document.getElementById('assessment-list');
        assessmentList.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            assessmentList.innerHTML = '<li>No assessments found</li>';
            return;
        }
        data.forEach(assessment => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${assessment.title}</strong> for <strong>${assessment.course_title}</strong><br>
                    Max Score: ${assessment.max_score} | Attempts: ${assessment.attempt_count}
                </div>
                <div>
                    <button onclick="fetchAssessmentAttempts('${assessment.id}')">View Attempts</button>
                </div>
            `;
            assessmentList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching assessments:', err);
        document.getElementById('assessment-list').innerHTML = '<li>Error loading assessments: ' + err.message + '</li>';
    }
}

// Fetch and display assessment attempts
async function fetchAssessmentAttempts(assessmentId) {
    try {
        console.log('Fetching attempts for assessment:', assessmentId);
        const data = await fetchWithAuth(`http://localhost:3000/api/assessments/${assessmentId}/attempts`);
        console.log('Attempts fetched:', data);
        const assessmentList = document.getElementById('assessment-list');
        assessmentList.innerHTML = `<h3>Assessment Attempts</h3>`;
        if (!Array.isArray(data) || data.length === 0) {
            assessmentList.innerHTML += '<p>No attempts available</p>';
        } else {
            data.forEach(attempt => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${attempt.name}</strong> (${attempt.email})<br>
                        Score: ${attempt.score}/${attempt.max_score}<br>
                        Attempted: ${new Date(attempt.submitted_at).toLocaleDateString()}
                    </div>
                    <div></div>
                `;
                assessmentList.appendChild(li);
            });
        }
    } catch (err) {
        console.error('Error fetching attempts:', err);
        document.getElementById('assessment-list').innerHTML = '<li>Error loading attempts: ' + err.message + '</li>';
    }
}

// Fetch and display notifications
async function fetchNotifications() {
    try {
        console.log('Fetching notifications...');
        const data = await fetchWithAuth('http://localhost:3000/api/notifications?user_id=' + user.id);
        console.log('Notifications fetched:', data);
        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            notificationList.innerHTML = '<li>No notifications found</li>';
            return;
        }
        const userRecipientType = user.role === 'student' ? 'students' : user.role === 'instructor' ? 'tutors' : 'admins';
        const filteredNotifications = data.filter(notification => {
            const recipients = notification.recipient_type.split(',');
            return recipients.includes('all') || recipients.includes(userRecipientType);
        });
        if (filteredNotifications.length === 0) {
            notificationList.innerHTML = '<li>No notifications for your role</li>';
            return;
        }
        filteredNotifications.forEach(notification => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${notification.name}</strong> (${notification.email})<br>
                    Type: ${notification.notification_type}<br>
                    Recipients: ${notification.recipient_type}<br>
                    Message: ${notification.message}<br>
                    Sent: ${new Date(notification.created_at).toLocaleDateString()}
                </div>
                <div></div>
            `;
            notificationList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        document.getElementById('notification-list').innerHTML = '<li>Error loading notifications: ' + err.message + '</li>';
    }
}

// Fetch and display reports and analytics
async function fetchReports() {
    try {
        console.log('Fetching reports...');
        const data = await fetchWithAuth('http://localhost:3000/api/reports');
        console.log('Reports fetched:', data);
        const reportsList = document.getElementById('reports-list');
        reportsList.innerHTML = `
            <li>
                <div>Total Users: ${data.user_count}</div>
                <div></div>
            </li>
            <li>
                <div>Total Courses: ${data.course_count}</div>
                <div></div>
            </li>
            <li>
                <div>Total Enrollments: ${data.enrollment_count}</div>
                <div></div>
            </li>
            <li>
                <div>Total Completions: ${data.completion_count}</div>
                <div></div>
            </li>
            <li>
                <div>Total Revenue: $${data.total_revenue.toFixed(2)}</div>
                <div></div>
            </li>
        `;
        document.getElementById('totalRevenue').textContent = data.total_revenue.toFixed(2);

        // Setup Chart.js
        const ctx = document.getElementById('analyticsChart')?.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Users', 'Courses', 'Enrollments', 'Completions', 'Revenue ($1000s)'],
                    datasets: [{
                        label: 'Platform Metrics',
                        data: [
                            data.user_count,
                            data.course_count,
                            data.enrollment_count,
                            data.completion_count,
                            data.total_revenue / 1000
                        ],
                        backgroundColor: [
                            'rgba(75, 0, 130, 0.6)',
                            'rgba(0, 123, 255, 0.6)',
                            'rgba(138, 43, 226, 0.6)',
                            'rgba(30, 144, 255, 0.6)',
                            'rgba(147, 112, 219, 0.6)'
                        ],
                        borderColor: [
                            'rgba(75, 0, 130, 1)',
                            'rgba(0, 123, 255, 1)',
                            'rgba(138, 43, 226, 1)',
                            'rgba(30, 144, 255, 1)',
                            'rgba(147, 112, 219, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            console.warn('Analytics chart canvas not found');
        }
    } catch (err) {
        console.error('Error fetching reports:', err);
        document.getElementById('reports-list').innerHTML = '<li>Error loading reports: ' + err.message + '</li>';
    }
}

// Fetch and display financials
async function fetchFinancials() {
    try {
        console.log('Fetching financials...');
        const data = await fetchWithAuth('http://localhost:3000/api/financials');
        console.log('Financials fetched:', data);
        document.getElementById('totalRevenue').textContent = data.total_revenue.toFixed(2);
    } catch (err) {
        console.error('Error fetching financials:', err);
        showError('Error loading financials: ' + err.message);
    }
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        const profile = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`);
        document.getElementById('dashboard-profile-picture').src = profile.profile_picture_url || '/assets/avatars/default.png';
        await Promise.all([
            fetchCourses(),
            fetchSubmissions(),
            fetchUsers(),
            fetchCertificates(),
            fetchEvents(),
            fetchForums(),
            fetchAssessments(),
            fetchNotifications(),
            fetchReports(),
            fetchFinancials()
        ]);
        setupCertificateFilters();
    } catch (err) {
        console.error('Error initializing dashboard:', err);
        showError('Failed to initialize dashboard: ' + err.message);
    }
}

// Run initialization
initializeDashboard();