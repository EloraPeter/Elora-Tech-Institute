const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Get single course by ID (public access)
router.get('/id/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all courses (public or all for admins)
router.get('/', async (req, res) => {
  const { filter } = req.query;
  try {
    if (filter === 'all' && req.user?.role === 'admin') {
      const result = await pool.query('SELECT c.*, u.name AS instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id');
      res.json(result.rows);
    } else {
      const result = await pool.query('SELECT c.*, u.name AS instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = $1', ['approved']);
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a course (requires instructor role)
router.post('/', authenticateJWT, async (req, res) => {
  if (!req.user || req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const {
    title,
    description,
    price,
    duration,
    course_type,
    live_date,
    enrollment_deadline
  } = req.body;

  // Server-side validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ error: 'Description is required and must be a non-empty string' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Price is required and must be a non-negative number' });
  }
  if (!course_type || typeof course_type !== 'string') {
    return res.status(400).json({ error: 'Course type is required and must be a string' });
  }
  if (!live_date || isNaN(Date.parse(live_date))) {
    return res.status(400).json({ error: 'Live date is required and must be a valid date' });
  }
  if (!enrollment_deadline || isNaN(Date.parse(enrollment_deadline))) {
    return res.status(400).json({ error: 'Enrollment deadline is required and must be a valid date' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO courses (
        title, description, price, duration, course_type, instructor_id, 
        status, live_date, enrollment_deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        title.trim(),
        description.trim(),
        price,
        duration,
        course_type,
        req.user.id,
        'pending',
        live_date,
        enrollment_deadline
      ]
    );
    await pool.query(
      'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
      [req.user.id, 'course_submitted', `Your course "${title}" has been submitted for review.`]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit a course (requires instructor role)
router.patch('/:id', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a course (requires instructor role)
router.delete('/:id', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve a course (requires admin role)
router.patch('/:id/approve', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const { feedback } = req.body; // Optional feedback
  try {
    const result = await pool.query(
      'UPDATE courses SET status = $1, approved_at = CURRENT_TIMESTAMP, rejection_feedback = COALESCE($2, rejection_feedback) WHERE id = $3 RETURNING *',
      ['approved', feedback || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const notificationMessage = feedback
      ? `Your course "${result.rows[0].title}" has been approved! Feedback: ${feedback}`
      : `Your course "${result.rows[0].title}" has been approved!`;
    await pool.query(
      'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
      [result.rows[0].instructor_id, 'course_approved', notificationMessage]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error approving course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a course (requires admin role)
router.patch('/:id/reject', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const { feedback } = req.body; // Optional feedback
  try {
    const result = await pool.query(
      'UPDATE courses SET status = $1, rejection_feedback = COALESCE($2, rejection_feedback) WHERE id = $3 RETURNING *',
      ['rejected', feedback || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const notificationMessage = feedback
      ? `Your course "${result.rows[0].title}" was rejected. Feedback: ${feedback}`
      : `Your course "${result.rows[0].title}" was rejected.`;
    // In /:id/reject endpoint, replace the feedback update with:
    await pool.query(
      'INSERT INTO course_feedback (course_id, feedback, created_by) VALUES ($1, $2, $3)',
      [id, feedback, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error rejecting course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending courses (requires admin role)
router.get('/pending', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT c.*, u.name AS instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = $1',
      ['pending']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending courses:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload course content (requires instructor role)
router.post('/:id/content', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { id } = req.params;
  const { title, file_type, file_url } = req.body;
  if (!['video', 'pdf', 'ebook', 'other'].includes(file_type)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id =IRA $1 AND status = $2', [id, 'approved']);
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
    console.error('Error uploading course content:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course content (requires student role and enrollment)
router.get('/:id/content', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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
    console.error('Error fetching course content:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete course content (requires instructor role)
router.delete('/:id/content/:contentId', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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
    console.error('Error deleting course content:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled students and progress (requires instructor role)
router.get('/:id/students', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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
    console.error('Error fetching enrolled students:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course analytics (requires instructor role)
router.get('/:id/analytics', authenticateJWT, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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
    console.error('Error fetching course analytics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;