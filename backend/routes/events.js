const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Get events
router.get('/', authenticateJWT, async (req, res) => {
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
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event
router.delete('/:id', authenticateJWT, async (req, res) => {
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
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;