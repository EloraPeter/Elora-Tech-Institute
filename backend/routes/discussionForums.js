const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get discussion forums
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== parseInt(user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT df.*, c.title AS course_title ' +
      'FROM discussion_forums df ' +
      'JOIN courses c ON df.course_id = c.id ' +
      'JOIN enrollments e ON c.id = e.course_id ' +
      'WHERE e.user_id = $1',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get discussion posts
router.get('/:id/posts', async (req, res) => {
  const { id } = req.params;
  try {
    const forum = await pool.query(
      'SELECT * FROM discussion_forums WHERE id = $1 AND course_id IN (SELECT course_id FROM enrollments WHERE user_id = $2)',
      [id, req.user.id]
    );
    if (forum.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or forum not found' });
    }
    const result = await pool.query(
      'SELECT dp.*, u.name, u.email FROM discussion_posts dp JOIN users u ON dp.user_id = u.id WHERE dp.forum_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Post to discussion forum
router.post('/:id/posts', async (req, res) => {
  const { id } = req.params;
  const { user_id, content } = req.body;
  if (req.user.id !== user_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const forum = await pool.query(
      'SELECT * FROM discussion_forums WHERE id = $1 AND course_id IN (SELECT course_id FROM enrollments WHERE user_id = $2)',
      [id, user_id]
    );
    if (forum.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or forum not found' });
    }
    const result = await pool.query(
      'INSERT INTO discussion_posts (forum_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete discussion post
router.delete('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await pool.query('SELECT * FROM discussion_posts WHERE id = $1', [id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (req.user.id !== post.rows[0].user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query('DELETE FROM discussion_posts WHERE id = $1 RETURNING *', [id]);
    res.json({ message: 'Post deleted', post: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;