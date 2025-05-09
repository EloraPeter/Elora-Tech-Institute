const express = require('express');
const pool = require('../db');
const router = express.Router();

// Issue certificate
router.post('/', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
router.get('/', async (req, res) => {
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

// Placeholder for certificate download
router.get('/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const certificate = await pool.query(
      'SELECT * FROM certificates WHERE id = $1 AND (user_id = $2 OR $3 = TRUE)',
      [id, req.user.id, req.user.role === 'admin']
    );
    if (certificate.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.status(501).json({ error: 'Certificate download not implemented' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;