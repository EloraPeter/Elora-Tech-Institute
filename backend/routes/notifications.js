const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

const VALID_NOTIFICATION_TYPES = ['admin_notification', 'general', 'system_alert'];
const VALID_RECIPIENT_TYPES = ['students', 'tutors', 'admins', 'all'];

// Send notification
router.post('/', authenticateJWT, async (req, res) => {
    const { course_id, message, recipient_type, notification_type } = req.body;
    if (!message || !notification_type) {
        console.error('Missing required fields:', { message, notification_type });
        return res.status(400).json({ error: 'Message and notification type are required' });
    }

    if (!VALID_NOTIFICATION_TYPES.includes(notification_type)) {
        console.error(`Invalid notification type: ${notification_type}`);
        return res.status(400).json({ error: `Notification type must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}` });
    }

    // Validate recipient_type
    let recipientTypes = recipient_type ? recipient_type.split(',').map(t => t.trim()) : ['all'];
    if (!recipientTypes.every(t => VALID_RECIPIENT_TYPES.includes(t))) {
        console.error(`Invalid recipient type: ${recipient_type}`);
        return res.status(400).json({ error: `Recipient type must be a comma-separated list of: ${VALID_RECIPIENT_TYPES.join(', ')}` });
    }
    if (recipientTypes.includes('all') && recipientTypes.length > 1) {
        console.error('Invalid recipient type: "all" cannot be combined with other types');
        return res.status(400).json({ error: '"all" cannot be combined with other recipient types' });
    }

    try {
        if (course_id) {
            if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
                console.error(`Unauthorized course notification attempt by user ${req.user.id} with role ${req.user.role}`);
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const course = await pool.query('SELECT * FROM courses WHERE id = $1', [course_id]);
            if (course.rows.length === 0) {
                console.error(`Course not found: ${course_id}`);
                return res.status(404).json({ error: 'Course not found' });
            }
            if (req.user.role === 'instructor' && req.user.id !== course.rows[0].instructor_id) {
                console.error(`Unauthorized course notification by instructor ${req.user.id} for course ${course_id}`);
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const students = await pool.query(
                'SELECT user_id FROM enrollments WHERE course_id = $1',
                [course_id]
            );
            const notifications = students.rows.map(student => pool.query(
                'INSERT INTO notifications (user_id, notification_type, message, course_id, recipient_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [student.user_id, notification_type, message, course_id, 'students']
            ));
            const results = await Promise.all(notifications);
            console.log(`Sent ${results.length} course notifications for course ${course_id}`);
        } else {
            if (req.user.role !== 'admin') {
                console.error(`Unauthorized platform notification attempt by user ${req.user.id} with role ${req.user.role}`);
                return res.status(403).json({ error: 'Unauthorized' });
            }
            let users;
            if (recipientTypes.includes('all')) {
                users = await pool.query('SELECT id, role FROM users');
            } else {
                const roles = recipientTypes.map(t => t === 'students' ? 'student' : t === 'tutors' ? 'instructor' : 'admin');
                users = await pool.query(
                    'SELECT id, role FROM users WHERE role = ANY($1)',
                    [roles]
                );
            }
            const notifications = users.rows.map(user => pool.query(
                'INSERT INTO notifications (user_id, notification_type, message, recipient_type) VALUES ($1, $2, $3, $4) RETURNING *',
                [user.id, notification_type, message, recipient_type]
            ));
            const results = await Promise.all(notifications);
            console.log(`Sent ${results.length} platform notifications to recipient_type: ${recipient_type}`);
        }
        res.status(201).json({ message: 'Notification sent' });
    } catch (err) {
        console.error('Error sending notification:', err);
        if (err.code === '23514') {
            return res.status(400).json({ error: 'Invalid notification or recipient type' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Get notifications
router.get('/', authenticateJWT, async (req, res) => {
    const { user_id } = req.query;
    if (req.user.id !== user_id) {
        console.error(`Unauthorized notification fetch by user ${req.user.id} for user ${user_id}`);
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const user = await pool.query('SELECT role FROM users WHERE id = $1', [user_id]);
        if (user.rows.length === 0) {
            console.error(`User not found: ${user_id}`);
            return res.status(404).json({ error: 'User not found' });
        }
        const userRole = user.rows[0].role;
        const recipientTypes = [
            'all',
            userRole === 'student' ? 'students' : userRole === 'instructor' ? 'tutors' : 'admins'
        ];
        const result = await pool.query(
            `SELECT n.*, u.name, u.email 
             FROM notifications n 
             JOIN users u ON n.user_id = u.id 
             WHERE n.user_id = $1 
             AND (n.recipient_type = 'all' 
                  OR n.recipient_type = $2 
                  OR n.recipient_type LIKE $3 
                  OR n.recipient_type LIKE $4 
                  OR n.recipient_type LIKE $5)
             ORDER BY n.created_at DESC`,
            [user_id, recipientTypes[1], `${recipientTypes[1]},%`, `%,${recipientTypes[1]}`, `%,${recipientTypes[1]},%`]
        );
        console.log(`Fetched ${result.rows.length} notifications for user ${user_id} with role ${userRole}`);
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
            console.error(`Notification not found: ${id}`);
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (req.user.id !== notification.rows[0].user_id) {
            console.error(`Unauthorized notification read attempt by user ${req.user.id} for notification ${id}`);
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const result = await pool.query(
            'UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *',
            [id]
        );
        console.log(`Marked notification ${id} as read`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;