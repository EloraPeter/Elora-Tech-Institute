const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Get assessments
router.get('/', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== user_id) {
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
    console.error('Error fetching assessments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get assessment attempts
router.get('/:id/attempts', authenticateJWT, async (req, res) => {
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
    console.error('Error fetching assessment attempts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit assessment attempt
router.post('/:id/attempts', authenticateJWT, async (req, res) => {
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
    console.error('Error submitting assessment attempt:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;