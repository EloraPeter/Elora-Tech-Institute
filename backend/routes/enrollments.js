const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get enrolled courses for a student
router.get('/', async (req, res) => {
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

module.exports = router;