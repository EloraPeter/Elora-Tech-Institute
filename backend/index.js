require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const auth = require('./auth');
const pay = require('./pay');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Apply auth and pay routes
const { authenticateJWT } = auth(app);
pay(app);

// Get single course by ID (for dynamic price fetching)
app.get('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all courses (approved or all for admins)
app.get('/api/courses/:filter?', async (req, res) => {
  const { filter } = req.params;
  try {
    if (filter === 'all') {
      const result = await pool.query('SELECT c.*, u.name AS instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id');
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT c.*, u.name AS instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = $1', ['approved']);
      res.json(result.rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new course (for instructors)
app.post('/api/courses', authenticateJWT, async (req, res) => {
  const { title, description, instructor_id, price, duration, course_type } = req.body;
  if (!['live', 'prerecorded', 'ebook'].includes(course_type)) {
    return res.status(400).json({ error: 'Invalid course type' });
  }
  if (req.user.role !== 'instructor' || req.user.id !== instructor_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO courses (title, description, instructor_id, price, duration, course_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, description, instructor_id, price || 0.00, duration, course_type, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit a course
app.patch('/api/courses/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, description, price, duration, course_type } = req.body;
  if (course_type && !['live', 'prerecorded', 'ebook'].includes(course_type)) {
    return res.status(400).json({ error: 'Invalid course type' });
  }
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (req.user.role !== 'instructor' || req.user.id !== course.rows[0].instructor_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'UPDATE courses SET title = COALESCE($1, title), description = COALESCE($2, description), price = COALESCE($3, price), duration = COALESCE($4, duration), course_type = COALESCE($5, course_type) WHERE id = $6 AND status = $7 RETURNING *',
      [title, description, price, duration, course_type, id, 'pending']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or not editable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a course
app.delete('/api/courses/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (req.user.role !== 'instructor' || req.user.id !== course.rows[0].instructor_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    res.json({ message: 'Course deleted', course: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve a course
app.patch('/api/courses/:id/approve', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'UPDATE courses SET status = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['approved', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    await pool.query(
      'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
      [result.rows[0].instructor_id, 'course_approved', `Your course "${result.rows[0].title}" has been approved!`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a course
app.patch('/api/courses/:id/reject', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'UPDATE courses SET status = $1 WHERE id = $2 RETURNING *',
      ['rejected', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    await pool.query(
      'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
      [result.rows[0].instructor_id, 'course_rejected', `Your course "${result.rows[0].title}" was rejected.`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload course content
app.post('/api/courses/:id/content', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, file_type, file_url } = req.body;
  if (!['video', 'pdf', 'ebook', 'other'].includes(file_type)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1 AND status = $2', [id, 'approved']);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or not approved' });
    }
    if (req.user.role !== 'instructor' || req.user.id !== course.rows[0].instructor_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'INSERT INTO course_content (course_id, title, file_type, file_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, title, file_type, file_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course content
app.get('/api/courses/:id/content', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access restricted to students' });
  }
  const { id } = req.params;
  try {
    const enrollment = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND payment_status = $3',
      [req.user.id, id, 'completed']
    );
    if (enrollment.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }
    const result = await pool.query('SELECT * FROM course_content WHERE course_id = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete course content
app.delete('/api/courses/:id/content/:contentId', authenticateJWT, async (req, res) => {
  const { id, contentId } = req.params;
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (req.user.role !== 'instructor' || req.user.id !== course.rows[0].instructor_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'DELETE FROM course_content WHERE id = $1 AND course_id = $2 RETURNING *',
      [contentId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({ message: 'Content deleted', content: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled students and progress
app.get('/api/courses/:id/students', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (req.user.role !== 'instructor' || req.user.id !== course.rows[0].instructor_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, e.progress FROM enrollments e JOIN users u ON e.user_id = u.id WHERE e.course_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get instructor earnings
app.get('/api/instructors/:id/earnings', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'instructor' || req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT SUM(p.amount) as total_earnings FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.instructor_id = $1 AND p.status = $2',
      [id, 'success']
    );
    res.json({ total_earnings: parseFloat(result.rows[0].total_earnings) || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send notification
app.post('/api/notifications', authenticateJWT, async (req, res) => {
  const { course_id, message, target_role } = req.body;
  if (req.user.role !== 'admin' && !course_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    if (course_id) {
      const course = await pool.query('SELECT * FROM courses WHERE id = $1', [course_id]);
      if (course.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
      if (req.user.role === 'instructor' && req.user.id !== course.rows[0].instructor_id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const students = await pool.query(
        'SELECT user_id FROM enrollments WHERE course_id = $1',
        [course_id]
      );
      const notifications = students.rows.map(student => pool.query(
        'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
        [student.user_id, 'course_notification', message]
      ));
      await Promise.all(notifications);
    } else if (target_role) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const users = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        [target_role]
      );
      const notifications = users.rows.map(user => pool.query(
        'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
        [user.id, 'platform_notification', message]
      ));
      await Promise.all(notifications);
    } else {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const users = await pool.query('SELECT id FROM users');
      const notifications = users.rows.map(user => pool.query(
        'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
        [user.id, 'platform_notification', message]
      ));
      await Promise.all(notifications);
    }
    res.status(201).json({ message: 'Notification sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notifications
app.get('/api/notifications', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT n.*, u.name, u.email FROM notifications n JOIN users u ON n.user_id = u.id WHERE n.user_id = $1 ORDER BY n.created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (notification.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (req.user.id !== notification.rows[0].user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course analytics
app.get('/api/courses/:id/analytics', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (req.user.role !== 'instructor' || req.user.id !== course.rows[0].instructor_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const enrollments = await pool.query(
      'SELECT COUNT(*) as enrollment_count FROM enrollments WHERE course_id = $1',
      [id]
    );
    const reviews = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE course_id = $1',
      [id]
    );
    const completions = await pool.query(
      'SELECT COUNT(*) as completion_count FROM course_completions WHERE course_id = $1',
      [id]
    );
    res.json({
      enrollment_count: parseInt(enrollments.rows[0].enrollment_count),
      avg_rating: parseFloat(reviews.rows[0].avg_rating) || 0,
      review_count: parseInt(reviews.rows[0].review_count),
      completion_count: parseInt(completions.rows[0].completion_count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.patch('/api/users/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { name, bio, expertise } = req.body;
  if (req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), expertise = COALESCE($3, expertise) WHERE id = $4 RETURNING id, name, email, role, bio, expertise',
      [name, bio, expertise, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
app.get('/api/users', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query('SELECT id, name, email, role, bio, expertise FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a user
app.delete('/api/users/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Promote a user
app.patch('/api/users/:id/promote', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!['student', 'instructor', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get basic reports
app.get('/api/reports', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const users = await pool.query('SELECT COUNT(*) AS user_count FROM users');
    const courses = await pool.query('SELECT COUNT(*) AS course_count FROM courses');
    const enrollments = await pool.query('SELECT COUNT(*) AS enrollment_count FROM enrollments');
    const completions = await pool.query('SELECT COUNT(*) AS completion_count FROM course_completions');
    const revenue = await pool.query('SELECT SUM(amount) AS total_revenue FROM payments WHERE status = $1', ['success']);
    res.json({
      user_count: parseInt(users.rows[0].user_count),
      course_count: parseInt(courses.rows[0].course_count),
      enrollment_count: parseInt(enrollments.rows[0].enrollment_count),
      completion_count: parseInt(completions.rows[0].completion_count),
      total_revenue: parseFloat(revenue.rows[0].total_revenue) || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get financial overview
app.get('/api/financials', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const totalRevenue = await pool.query(
      'SELECT SUM(amount) as total_revenue FROM payments WHERE status = $1',
      ['success']
    );
    const instructorEarnings = await pool.query(
      'SELECT c.instructor_id, u.name, SUM(p.amount) as earnings FROM payments p JOIN courses c ON p.course_id = c.id JOIN users u ON c.instructor_id = u.id WHERE p.status = $1 GROUP BY c.instructor_id, u.name',
      ['success']
    );
    res.json({
      total_revenue: parseFloat(totalRevenue.rows[0].total_revenue) || 0,
      instructor_earnings: instructorEarnings.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course submissions
app.get('/api/course-submissions', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT cs.*, c.title AS course_title, u.name AS instructor_name FROM course_submissions cs JOIN courses c ON cs.course_id = c.id JOIN users u ON cs.instructor_id = u.id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve or reject course submission
app.patch('/api/course-submissions/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { status, admin_comments } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const result = await pool.query(
      'UPDATE course_submissions SET status = $1, admin_comments = $2 WHERE id = $3 RETURNING *',
      [status, admin_comments, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    await pool.query(
      'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
      [result.rows[0].instructor_id, `course_submission_${status}`, `Your submission for "${result.rows[0].course_title}" was ${status}. ${admin_comments || ''}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get events
app.get('/api/events', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT e.*, c.title AS course_title ' +
      'FROM events e ' +
      'JOIN courses c ON e.course_id = c.id ' +
      'JOIN enrollments e2 ON c.id = e2.course_id ' +
      'WHERE e2.user_id = $1',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event
app.delete('/api/events/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted', event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get discussion forums
app.get('/api/discussion-forums', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT df.*, c.title AS course_title ' +
      'FROM discussion_forums df ' +
      'JOIN courses c ON df.course_id = c.id ' +
      'JOIN enrollments e ON c.id = e.course_id ' +
      'WHERE e.user_id = $1',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get discussion posts
app.get('/api/discussion-forums/:id/posts', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const forum = await pool.query(
      'SELECT * FROM discussion_forums WHERE id = $1 AND course_id IN (SELECT course_id FROM enrollments WHERE user_id = $2)',
      [id, req.user.id]
    );
    if (forum.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or forum not found' });
    }
    const result = await pool.query(
      'SELECT dp.*, u.name, u.email FROM discussion_posts dp JOIN users u ON dp.user_id = u.id WHERE dp.forum_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Post to discussion forum
app.post('/api/discussion-forums/:id/posts', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { user_id, content } = req.body;
  if (req.user.id !== user_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const forum = await pool.query(
      'SELECT * FROM discussion_forums WHERE id = $1 AND course_id IN (SELECT course_id FROM enrollments WHERE user_id = $2)',
      [id, user_id]
    );
    if (forum.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or forum not found' });
    }
    const result = await pool.query(
      'INSERT INTO discussion_posts (forum_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete discussion post
app.delete('/api/discussion-posts/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await pool.query('SELECT * FROM discussion_posts WHERE id = $1', [id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (req.user.id !== post.rows[0].user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query('DELETE FROM discussion_posts WHERE id = $1 RETURNING *', [id]);
    res.json({ message: 'Post deleted', post: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get assessments
app.get('/api/assessments', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT a.*, c.title AS course_title, ' +
      '(SELECT COUNT(*) FROM assessment_attempts aa WHERE aa.assessment_id = a.id AND aa.user_id = $1) AS attempt_count ' +
      'FROM assessments a ' +
      'JOIN courses c ON a.course_id = c.id ' +
      'JOIN enrollments e ON c.id = e.course_id ' +
      'WHERE e.user_id = $1',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get assessment attempts
app.get('/api/assessments/:id/attempts', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const assessment = await pool.query(
      'SELECT * FROM assessments WHERE id = $1 AND course_id IN (SELECT course_id FROM enrollments WHERE user_id = $2)',
      [id, req.user.id]
    );
    if (assessment.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or assessment not found' });
    }
    const result = await pool.query(
      'SELECT aa.*, u.name, u.email FROM assessment_attempts aa JOIN users u ON aa.user_id = u.id WHERE aa.assessment_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit assessment attempt
app.post('/api/assessments/:id/attempts', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { user_id, score, attempt_number } = req.body;
  if (req.user.id !== user_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const assessment = await pool.query('SELECT max_attempts FROM assessments WHERE id = $1', [id]);
    if (assessment.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const enrollment = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = (SELECT course_id FROM assessments WHERE id = $2)',
      [user_id, id]
    );
    if (enrollment.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }
    const attempts = await pool.query(
      'SELECT COUNT(*) AS count FROM assessment_attempts WHERE assessment_id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (parseInt(attempts.rows[0].count) >= assessment.rows[0].max_attempts) {
      return res.status(400).json({ error: 'Maximum attempts reached' });
    }
    const result = await pool.query(
      'INSERT INTO assessment_attempts (assessment_id, user_id, score, attempt_number) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, user_id, score, attempt_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Issue certificate
app.post('/api/certificates', authenticateJWT, async (req, res) => {
  const { user_id, course_id } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const completion = await pool.query(
      'SELECT * FROM course_completions WHERE user_id = $1 AND course_id = $2 AND certificate_issued = FALSE',
      [user_id, course_id]
    );
    if (completion.rows.length === 0) {
      return res.status(404).json({ error: 'Completion not found or certificate already issued' });
    }
    const course = await pool.query('SELECT title FROM courses WHERE id = $1', [course_id]);
    const result = await pool.query(
      'INSERT INTO certificates (user_id, course_id, certificate_id, certificate_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, course_id, null, null]
    );
    await pool.query(
      'UPDATE course_completions SET certificate_issued = TRUE, certificate_id = $1 WHERE user_id = $2 AND course_id = $3',
      [result.rows[0].id, user_id, course_id]
    );
    await pool.query(
      'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
      [user_id, 'certificate_issued', `Congratulations! You received a certificate for "${course.rows[0].title}".`]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Revoke certificate
app.delete('/api/certificates/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const certificate = await pool.query('SELECT * FROM certificates WHERE id = $1', [id]);
    if (certificate.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    await pool.query(
      'UPDATE course_completions SET certificate_issued = FALSE, certificate_id = NULL WHERE certificate_id = $1',
      [id]
    );
    const result = await pool.query('DELETE FROM certificates WHERE id = $1 RETURNING *', [id]);
    await pool.query(
      'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
      [certificate.rows[0].user_id, 'certificate_revoked', 'Your certificate has been revoked. Please contact support.']
    );
    res.json({ message: 'Certificate revoked', certificate: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get certificates
app.get('/api/certificates', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT c.*, u.name AS user_name, co.title AS course_title ' +
      'FROM certificates c ' +
      'JOIN users u ON c.user_id = u.id ' +
      'JOIN courses co ON c.course_id = co.id ' +
      'WHERE c.user_id = $1 OR $2 = TRUE',
      [user_id, req.user.role === 'admin']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course completions
app.get('/api/course-completions', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT cc.*, u.name AS user_name, c.title AS course_title ' +
      'FROM course_completions cc ' +
      'JOIN users u ON cc.user_id = u.id ' +
      'JOIN courses c ON cc.course_id = c.id ' +
      'WHERE cc.user_id = $1 OR $2 = TRUE',
      [user_id, req.user.role === 'admin']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled courses for a student
app.get('/api/enrollments', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT e.*, c.title AS course_title, c.description, c.price, c.duration, c.course_type, cc.score AS progress ' +
      'FROM enrollments e ' +
      'JOIN courses c ON e.course_id = c.id ' +
      'LEFT JOIN course_completions cc ON e.course_id = cc.course_id AND e.user_id = cc.user_id ' +
      'WHERE e.user_id = $1 AND e.payment_status = $2',
      [user_id, 'completed']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/users/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, bio, expertise FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Placeholder for certificate download
app.get('/api/certificates/:id/download', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const certificate = await pool.query(
      'SELECT * FROM certificates WHERE id = $1 AND (user_id = $2 OR $3 = TRUE)',
      [id, req.user.id, req.user.role === 'admin']
    );
    if (certificate.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    // Implement PDF generation (e.g., using pdfkit)
    res.status(501).json({ error: 'Certificate download not implemented' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));