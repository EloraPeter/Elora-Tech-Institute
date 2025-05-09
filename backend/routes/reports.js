const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get basic reports
router.get('/', async (req, res) => {
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

module.exports = router;