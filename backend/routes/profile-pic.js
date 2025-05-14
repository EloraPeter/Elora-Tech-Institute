const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');

const router = express.Router();
const pool = new Pool({ /* Database config */ });

// Multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/profile_pictures/',
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Upload profile picture
router.post('/users/:id/profile-picture', upload.single('profile_picture'), async (req, res) => {
    try {
        const userId = req.params.id;
        const filePath = `/uploads/profile_pictures/${req.file.filename}`;
        await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [filePath, userId]);
        res.json({ profile_picture_url: filePath });
    } catch (err) {
        res.status(500).json({ error: 'Failed to upload picture' });
    }
});

// OAuth signup (example for GitHub)
router.post('/auth/github', async (req, res) => {
    const { code } = req.body;
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
        }, { headers: { Accept: 'application/json' } });
        const accessToken = tokenResponse.data.access_token;

        // Fetch user data
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const { login, email, avatar_url } = userResponse.data;

        // Check if user exists
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length > 0) {
            // User exists, update profile picture if needed
            await pool.query('UPDATE users SET profile_picture_url = $1 WHERE email = $2', [avatar_url, email]);
            return res.json({ user: rows[0] });
        }

        // Create new user
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, profile_picture_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [login, email, 'oauth', 'student', avatar_url]
        );
        res.json({ user: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to authenticate with GitHub' });
    }
});

// Similar endpoint for Google OAuth
router.post('/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { name, email, picture } = userResponse.data;

        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length > 0) {
            await pool.query('UPDATE users SET profile_picture_url = $1 WHERE email = $2', [picture, email]);
            return res.json({ user: rows[0] });
        }

        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, profile_picture_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, 'oauth', 'student', picture]
        );
        res.json({ user: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
});