const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Get course completions
router.get('/', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== user_id && req.user.role !== 'admin') {
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
    console.error('Error fetching course completions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;