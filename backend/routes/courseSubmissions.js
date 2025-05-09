const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth'); // Import authenticateJWT from auth.js

const router = express.Router();

// Get course submissions (requires admin role)
router.get('/', authenticateJWT, async (req, res) => {
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

// Approve or reject course submission (requires admin role)
router.patch('/:id', authenticateJWT, async (req, res) => {
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

module.exports = router;