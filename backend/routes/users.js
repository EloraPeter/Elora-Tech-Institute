const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Update user profile
router.patch('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { name, bio, expertise } = req.body;
    if (req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const result = await pool.query(
            'UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), expertise = COALESCE($3, expertise) WHERE id = $4 RETURNING id, name, email, role, bio, expertise',
            [name, bio, expertise, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users
router.get('/', authenticateJWT, async (req, res) => {
    if (!['admin', 'instructor'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const result = await pool.query('SELECT id, name, email, role, bio, expertise FROM users WHERE role = $1', [req.query.role]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a user
router.delete('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Promote a user
router.patch('/:id/promote', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!['student', 'instructor', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
            [role, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
router.get('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, bio, expertise FROM users WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get instructor earnings
router.get('/:id/earnings', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'instructor' || req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const result = await pool.query(
            'SELECT SUM(p.amount) as total_earnings FROM payments p JOIN courses c ON p.course_id = c.id WHERE c.instructor_id = $1 AND p.status = $2',
            [id, 'success']
        );
        res.json({ total_earnings: parseFloat(result.rows[0].total_earnings) || 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;