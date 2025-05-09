const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth'); // Import authenticateJWT

const router = express.Router();

// Get single course by ID (public access, no auth required)
router.get('/:id', async (req, res) => {
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

// Get all courses (public access, no auth required)
router.get('/:filter?', async (req, res) => {
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

// Create a new course (requires instructor role)
router.post('/', authenticateJWT, async (req, res) => {
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

// Edit a course (requires instructor role)
router.patch('/:id', authenticateJWT, async (req, res) => {
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

// Delete a course (requires instructor role)
router.delete('/:id', authenticateJWT, async (req, res) => {
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

// Approve a course (requires admin role)
router.patch('/:id/approve', authenticateJWT, async (req, res) => {
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

// Reject a course (requires admin role)
router.patch('/:id/reject', authenticateJWT, async (req, res) => {
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

// Upload course content (requires instructor role)
router.post('/:id/content', authenticateJWT, async (req, res) => {
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

// Get course content (requires student role and enrollment)
router.get('/:id/content', authenticateJWT, async (req, res) => {
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

// Delete course content (requires instructor role)
router.delete('/:id/content/:contentId', authenticateJWT, async (req, res) => {
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

// Get enrolled students and progress (requires instructor role)
router.get('/:id/students', authenticateJWT, async (req, res) => {
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

// Get course analytics (requires instructor role)
router.get('/:id/analytics', authenticateJWT, async (req, res) => {
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

module.exports = router;