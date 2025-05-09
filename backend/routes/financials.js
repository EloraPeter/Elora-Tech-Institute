const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get financial overview
router.get('/', async (req, res) => {
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

module.exports = router;