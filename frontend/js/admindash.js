
        // Authentication check
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
        }
        document.getElementById('userName').textContent = user.name;

        // Modal handling
        function openModal(modalId) {
            document.getElementById(modalId).style.display = 'flex';
        }
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
            if (modalId === 'notificationModal') {
                document.getElementById('notification-target').value = '';
                document.getElementById('notification-message').value = '';
            } else if (modalId === 'promoteUserModal') {
                document.getElementById('promote-user-id').value = '';
                document.getElementById('promote-role').value = 'student';
            } else if (modalId === 'updateUserModal') {
                document.getElementById('update-user-id').value = '';
                document.getElementById('update-user-name').value = '';
                document.getElementById('update-user-bio').value = '';
                document.getElementById('update-user-expertise').value = '';
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
                const response = await fetch(`http://localhost:3000/api/courses/${courseId}/approve`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (response.ok) {
                    fetchCourses();
                    showError('Course Approved! Empowering Learners! 🎉', '#28a745');
                } else {
                    showError(data.error || 'Failed to approve course');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        }

        // Reject a course
        async function rejectCourse(courseId) {
            try {
                const response = await fetch(`http://localhost:3000/api/courses/${courseId}/reject`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (response.ok) {
                    fetchCourses();
                    showError('Course rejected successfully!', '#28a745');
                } else {
                    showError(data.error || 'Failed to reject course');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        }

        // Delete a course
        async function deleteCourse(courseId) {
            if (confirm('Are you sure you want to delete this course?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        fetchCourses();
                        showError('Course deleted successfully!', '#28a745');
                    } else {
                        showError(data.error || 'Failed to delete course');
                    }
                } catch (err) {
                    showError('Network error. Please try again.');
                }
            }
        }

        // Review course submission
        async function reviewSubmission() {
            const id = document.getElementById('submission-id').value;
            const status = document.getElementById('submission-status').value;
            const admin_comments = document.getElementById('submission-comments').value;
            try {
                const response = await fetch(`http://localhost:3000/api/course-submissions/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status, admin_comments })
                });
                const data = await response.json();
                if (response.ok) {
                    fetchSubmissions();
                    closeModal('reviewSubmissionModal');
                    showError(`Submission ${status}! Feedback sent.`, '#28a745');
                } else {
                    showError(data.error || 'Failed to review submission');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        }

        // Delete a user
        async function deleteUser(userId) {
            if (confirm('Are you sure you want to delete this user?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        fetchUsers();
                        showError('User deleted successfully!', '#28a745');
                    } else {
                        showError(data.error || 'Failed to delete user');
                    }
                } catch (err) {
                    showError('Network error. Please try again.');
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
                const response = await fetch(`http://localhost:3000/api/users/${userId}/promote`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role })
                });
                const data = await response.json();
                if (response.ok) {
                    fetchUsers();
                    closeModal('promoteUserModal');
                    showError('User role updated successfully!', '#28a745');
                } else {
                    showError(data.error || 'Failed to update user role');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        }

        // Open update user modal
        function openUpdateUser(user) {
            document.getElementById('update-user-id').value = user.id;
            document.getElementById('update-user-name').value = user.name;
            document.getElementById('update-user-bio').value = user.bio || '';
            document.getElementById('update-user-expertise').value = user.expertise || '';
            openModal('updateUserModal');
        }

        // Update user profile
        async function updateUser() {
            const id = document.getElementById('update-user-id').value;
            const name = document.getElementById('update-user-name').value;
            const bio = document.getElementById('update-user-bio').value;
            const expertise = document.getElementById('update-user-expertise').value;
            try {
                const response = await fetch(`http://localhost:3000/api/users/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, bio, expertise })
                });
                const data = await response.json();
                if (response.ok) {
                    fetchUsers();
                    closeModal('updateUserModal');
                    showError('User profile updated successfully!', '#28a745');
                } else {
                    showError(data.error || 'Failed to update profile');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        }

        // Send notification
        async function sendNotification() {
            const target_role = document.getElementById('notification-target').value;
            const message = document.getElementById('notification-message').value;
            try {
                const response = await fetch('http://localhost:3000/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, target_role })
                });
                const data = await response.json();
                if (response.ok) {
                    closeModal('notificationModal');
                    fetchNotifications();
                    showError('Announcement sent successfully! 📣', '#28a745');
                } else {
                    showError(data.error || 'Failed to send announcement');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        }

        // Delete course content
        async function deleteContent(courseId, contentId) {
            if (confirm('Are you sure you want to delete this content?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/courses/${courseId}/content/${contentId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        fetchCourseContent(courseId);
                        showError('Content deleted successfully!', '#28a745');
                    } else {
                        showError(data.error || 'Failed to delete content');
                    }
                } catch (err) {
                    showError('Network error. Please try again.');
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
                const response = await fetch('http://localhost:3000/api/certificates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id, course_id })
                });
                const data = await response.json();
                if (response.ok) {
                    fetchCertificates();
                    closeModal('issueCertificateModal');
                    showError('Certificate issued successfully! 🎓', '#28a745');
                } else {
                    showError(data.error || 'Failed to issue certificate');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        }

        // Revoke certificate
        async function revokeCertificate(certificateId) {
            if (confirm('Are you sure you want to revoke this certificate?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/certificates/${certificateId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        fetchCertificates();
                        showError('Certificate revoked successfully!', '#28a745');
                    } else {
                        showError(data.error || 'Failed to revoke certificate');
                    }
                } catch (err) {
                    showError('Network error. Please try again.');
                }
            }
        }

        // Download certificate (placeholder for future endpoint)
        async function downloadCertificate(certificateId) {
            try {
                const response = await fetch(`http://localhost:3000/api/certificates/${certificateId}/download`);
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
                showError('Network error. Please try again.');
            }
        }

        // Delete event
        async function deleteEvent(eventId) {
            if (confirm('Are you sure you want to delete this event?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        fetchEvents();
                        showError('Event deleted successfully!', '#28a745');
                    } else {
                        showError(data.error || 'Failed to delete event');
                    }
                } catch (err) {
                    showError('Network error. Please try again.');
                }
            }
        }

        // Delete discussion post
        async function deletePost(postId, forumId) {
            if (confirm('Are you sure you want to delete this post?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/discussion-posts/${postId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        fetchForumPosts(forumId);
                        showError('Post deleted successfully!', '#28a745');
                    } else {
                        showError(data.error || 'Failed to delete post');
                    }
                } catch (err) {
                    showError('Network error. Please try again.');
                }
            }
        }

        // Fetch and display courses
        async function fetchCourses() {
            try {
                const response = await fetch('http://localhost:3000/api/courses/all');
                const courses = await response.json();
                const courseList = document.getElementById('course-list');
                courseList.innerHTML = '';
                courses.forEach(course => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>${course.title}</strong> by ${course.instructor_name || 'Unknown'}<br>
                            ${course.description || 'No description'}<br>
                            Price: $${course.price} | Duration: ${course.duration} hours | Type: ${course.course_type}<br>
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
                document.getElementById('course-list').innerHTML = '<li>Error loading courses</li>';
            }
        }

        // Fetch and display course submissions
        async function fetchSubmissions() {
            try {
                const response = await fetch('http://localhost:3000/api/course-submissions');
                const submissions = await response.json();
                const submissionList = document.getElementById('submission-list');
                submissionList.innerHTML = '';
                submissions.forEach(sub => {
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
                document.getElementById('submission-list').innerHTML = '<li>Error loading submissions</li>';
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
                const response = await fetch('http://localhost:3000/api/users');
                const users = await response.json();
                const userList = document.getElementById('user-list');
                userList.innerHTML = '';
                if (!Array.isArray(users)) {
                    throw new Error('Expected an array of users');
                }
                if (users.length === 0) {
                    userList.innerHTML = '<li>No users found</li>';
                    return;
                }

                users.forEach(u => {
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
                            <button onclick="openUpdateUser(${JSON.stringify(u)})">Update</button>
                            <button onclick="openPromoteUser('${u.id}', '${u.role}')">Promote</button>
                            <button class="delete" onclick="deleteUser('${u.id}')">Delete</button>
                        </div>
                    `;
                    userList.appendChild(li);
                });
            } catch (err) {
                document.getElementById('user-list').innerHTML = '<li>Error loading users</li>';
            }
        }

        // Fetch and display course content
        async function fetchCourseContent(courseId) {
            try {
                const response = await fetch(`http://localhost:3000/api/courses/${courseId}/content`);
                const content = await response.json();
                const contentList = document.getElementById('content-list');
                contentList.innerHTML = `<h3>Content for Course</h3>`;
                if (content.length === 0) {
                    contentList.innerHTML += '<p>No content available</p>';
                } else {
                    content.forEach(item => {
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
                document.getElementById('content-list').innerHTML = '<li>Error loading content</li>';
            }
        }

        // Fetch and display certificates
        async function fetchCertificates() {
            try {
                const response = await fetch('http://localhost:3000/api/certificates');
                const certificates = await response.json();
                const completionsResponse = await fetch('http://localhost:3000/api/course-completions');
                const completions = await completionsResponse.json();
                const certificateList = document.getElementById('certificate-list');
                const userFilter = document.getElementById('certificate-user-filter').value.toLowerCase();
                const courseFilter = document.getElementById('certificate-course-filter').value.toLowerCase();

                certificateList.innerHTML = '';

                // Filter and display course completions eligible for certificates
                completions
                    .filter(completion =>
                        (!userFilter || completion.user_name.toLowerCase().includes(userFilter)) &&
                        (!courseFilter || completion.course_title.toLowerCase().includes(courseFilter))
                    )
                    .forEach(completion => {
                        const hasCertificate = certificates.find(cert =>
                            cert.user_id === completion.user_id && cert.course_id === completion.course_id
                        );
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div>
                                <strong>${completion.user_name}</strong> completed <strong>${completion.course_title}</strong><br>
                                Completion Date: ${new Date(completion.completed_at).toLocaleDateString()}<br>
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
                document.getElementById('certificate-list').innerHTML = '<li>Error loading certificates</li>';
                showError('Failed to load certificates. Please try again.');
            }
        }

        // Filter certificates on input
        function setupCertificateFilters() {
            const userFilter = document.getElementById('certificate-user-filter');
            const courseFilter = document.getElementById('certificate-course-filter');
            userFilter.addEventListener('input', fetchCertificates);
            courseFilter.addEventListener('input', fetchCertificates);
        }

        // Fetch and display events
        async function fetchEvents() {
            try {
                const response = await fetch('http://localhost:3000/api/events');
                const events = await response.json();
                const eventList = document.getElementById('event-list');
                eventList.innerHTML = '';
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>${event.title}</strong> for <strong>${event.course_title}</strong><br>
                            Scheduled: ${new Date(event.event_date).toLocaleString()}<br>
                            URL: <a href="${event.event_url}" target="_blank">Join</a>
                        </div>
                        <div>
                            <button class="delete" onclick="deleteEvent('${event.id}')">Delete</button>
                        </div>
                    `;
                    eventList.appendChild(li);
                });
            } catch (err) {
                document.getElementById('event-list').innerHTML = '<li>Error loading events</li>';
            }
        }

        // Fetch and display discussion forums
        async function fetchForums() {
            try {
                const response = await fetch('http://localhost:3000/api/discussion-forums');
                const forums = await response.json();
                const forumList = document.getElementById('forum-list');
                forumList.innerHTML = '';
                forums.forEach(forum => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>${forum.title}</strong> for <strong>${forum.course_title}</strong><br>
                            Description: ${forum.description.slice(0, 100)}...
                        </div>
                        <div>
                            <button onclick="fetchForumPosts('${forum.id}')">View Posts</button>
                        </div>
                    `;
                    forumList.appendChild(li);
                });
            } catch (err) {
                document.getElementById('forum-list').innerHTML = '<li>Error loading forums</li>';
            }
        }

        // Fetch and display discussion posts
        async function fetchForumPosts(forumId) {
            try {
                const response = await fetch(`http://localhost:3000/api/discussion-forums/${forumId}/posts`);
                const posts = await response.json();
                const forumList = document.getElementById('forum-list');
                forumList.innerHTML = `<h3>Posts in Forum</h3>`;
                if (posts.length === 0) {
                    forumList.innerHTML += '<p>No posts available</p>';
                } else {
                    posts.forEach(post => {
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
                document.getElementById('forum-list').innerHTML = '<li>Error loading posts</li>';
            }
        }

        // Fetch and display assessments
        async function fetchAssessments() {
            try {
                const response = await fetch('http://localhost:3000/api/assessments');
                const assessments = await response.json();
                const assessmentList = document.getElementById('assessment-list');
                assessmentList.innerHTML = '';
                assessments.forEach(assessment => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>${assessment.title}</strong> for <strong>${assessment.course_title}</strong><br>
                            Type: ${assessment.assessment_type} | Total Marks: ${assessment.total_marks}
                        </div>
                        <div>
                            <button onclick="fetchAssessmentAttempts('${assessment.id}')">View Attempts</button>
                        </div>
                    `;
                    assessmentList.appendChild(li);
                });
            } catch (err) {
                document.getElementById('assessment-list').innerHTML = '<li>Error loading assessments</li>';
            }
        }

        // Fetch and display assessment attempts
        async function fetchAssessmentAttempts(assessmentId) {
            try {
                const response = await fetch(`http://localhost:3000/api/assessments/${assessmentId}/attempts`);
                const attempts = await response.json();
                const assessmentList = document.getElementById('assessment-list');
                assessmentList.innerHTML = `<h3>Assessment Attempts</h3>`;
                if (attempts.length === 0) {
                    assessmentList.innerHTML += '<p>No attempts available</p>';
                } else {
                    attempts.forEach(attempt => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div>
                                <strong>${attempt.name}</strong> (${attempt.email})<br>
                                Score: ${attempt.score}/${attempt.total_marks}<br>
                                Attempted: ${new Date(attempt.attempted_at).toLocaleDateString()}
                            </div>
                            <div></div>
                        `;
                        assessmentList.appendChild(li);
                    });
                }
            } catch (err) {
                document.getElementById('assessment-list').innerHTML = '<li>Error loading attempts</li>';
            }
        }

        // Fetch and display notifications
        async function fetchNotifications() {
            try {
                const response = await fetch('http://localhost:3000/api/notifications');
                const notifications = await response.json();
                const notificationList = document.getElementById('notification-list');
                notificationList.innerHTML = '';
                notifications.forEach(notification => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>${notification.name}</strong> (${notification.email})<br>
                            Type: ${notification.notification_type}<br>
                            Message: ${notification.message}<br>
                            Sent: ${new Date(notification.created_at).toLocaleDateString()}
                        </div>
                        <div></div>
                    `;
                    notificationList.appendChild(li);
                });
            } catch (err) {
                document.getElementById('notification-list').innerHTML = '<li>Error loading notifications</li>';
            }
        }

        // Fetch and display reports and analytics
        async function fetchReports() {
            try {
                const response = await fetch('http://localhost:3000/api/reports');
                const reports = await response.json();
                const reportsList = document.getElementById('reports-list');
                reportsList.innerHTML = `
                    <li>
                        <div>Total Users: ${reports.user_count}</div>
                        <div></div>
                    </li>
                    <li>
                        <div>Total Courses: ${reports.course_count}</div>
                        <div></div>
                    </li>
                    <li>
                        <div>Total Enrollments: ${reports.enrollment_count}</div>
                        <div></div>
                    </li>
                    <li>
                        <div>Total Completions: ${reports.completion_count}</div>
                        <div></div>
                    </li>
                    <li>
                        <div>Total Revenue: $${reports.total_revenue.toFixed(2)}</div>
                        <div></div>
                    </li>
                `;
                document.getElementById('totalRevenue').textContent = reports.total_revenue.toFixed(2);

                // Setup Chart.js
                const ctx = document.getElementById('analyticsChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Users', 'Courses', 'Enrollments', 'Completions', 'Revenue ($1000s)'],
                        datasets: [{
                            label: 'Platform Metrics',
                            data: [
                                reports.user_count,
                                reports.course_count,
                                reports.enrollment_count,
                                reports.completion_count,
                                reports.total_revenue / 1000
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
            } catch (err) {
                document.getElementById('reports-list').innerHTML = '<li>Error loading reports</li>';
            }
        }

        // Fetch and display financials
        async function fetchFinancials() {
            try {
                const response = await fetch('http://localhost:3000/api/financials');
                const financials = await response.json();
                document.getElementById('totalRevenue').textContent = financials.total_revenue.toFixed(2);
            } catch (err) {
                showError('Error loading financials');
            }
        }

        // Initialize dashboard
        async function initializeDashboard() {
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
        }

        // Run initialization
        initializeDashboard();
    