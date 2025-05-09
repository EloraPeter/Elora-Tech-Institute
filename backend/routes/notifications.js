const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Send notification
router.post('/', authenticateJWT, async (req, res) => {
  const { course_id, message, target_role } = req.body;
  if (req.user.role !== 'admin' && !course_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    if (course_id) {
      const course = await pool.query('SELECT * FROM courses WHERE id = $1', [course_id]);
      if (course.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
      if (req.user.role === 'instructor' && req.user.id !== course.rows[0].instructor_id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const students = await pool.query(
        'SELECT user_id FROM enrollments WHERE course_id = $1',
        [course_id]
      );
      const notifications = students.rows.map(student => pool.query(
        'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
        [student.user_id, 'course_notification', message]
      ));
      await Promise.all(notifications);
    } else if (target_role) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const users = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        [target_role]
      );
      const notifications = users.rows.map(user => pool.query(
        'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
        [user.id, 'platform_notification', message]
      ));
      await Promise.all(notifications);
    } else {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const users = await pool.query('SELECT id FROM users');
      const notifications = users.rows.map(user => pool.query(
        'INSERT INTO notifications (user_id, notification_type, message) VALUES ($1, $2, $3)',
        [user.id, 'platform_notification', message]
      ));
      await Promise.all(notifications);
    }
    res.status(201).json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notifications
router.get('/', authenticateJWT, async (req, res) => {
  const { user_id } = req.query;
  if (req.user.id !== user_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT n.*, u.name, u.email FROM notifications n JOIN users u ON n.user_id = u.id WHERE n.user_id = $1 ORDER BY n.created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (notification.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (req.user.id !== notification.rows[0].user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;