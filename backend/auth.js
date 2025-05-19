const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new Error('Google OAuth credentials are not defined');
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) throw new Error('GitHub OAuth credentials are not defined');

// Multer for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../frontend/images/uploads/profile_pictures/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images (jpeg, jpg, png, gif) are allowed'));
        }
    }
});

// Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid or expired token' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Authentication token required' });
    }
};

// Passport setup for Google
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
        let user = result.rows[0];
        if (!user) {
            const result = await pool.query(
                'INSERT INTO users (name, email, role, oauth_provider, oauth_id, profile_picture_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [profile.displayName, profile.emails[0].value, 'student', 'google', profile.id, profile.photos[0]?.value || null]
            );
            user = result.rows[0];
        } else if (!user.profile_picture_url && profile.photos[0]?.value) {
            await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [profile.photos[0].value, user.id]);
            user.profile_picture_url = profile.photos[0].value;
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Passport setup for GitHub
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0]?.value || `${profile.id}@github.com`;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];
        if (!user) {
            const result = await pool.query(
                'INSERT INTO users (name, email, role, oauth_provider, oauth_id, profile_picture_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [profile.displayName || profile.username, email, 'student', 'github', profile.id, profile.photos[0]?.value || null]
            );
            user = result.rows[0];
        } else if (!user.profile_picture_url && profile.photos[0]?.value) {
            await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [profile.photos[0].value, user.id]);
            user.profile_picture_url = profile.photos[0].value;
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err, null);
    }
});

module.exports = (app) => {
    app.use(passport.initialize());

    // Register endpoint
    app.post('/api/register', async (req, res) => {
        const { name, email, password, role } = req.body;
        if (!['student', 'instructor', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await pool.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
                [name, email, hashedPassword, role]
            );
            res.status(201).json({ message: 'User registered', user: result.rows[0] });
        } catch (err) {
            res.status(400).json({ error: 'Email already exists or invalid email' });
        }
    });

    // Login endpoint
    app.post('/api/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = result.rows[0];
            if (!user) return res.status(401).json({ error: 'Invalid email or password' });
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

            res.json({
                message: 'Login successful',
                user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_picture_url: user.profile_picture_url },
                token,
                refreshToken
            });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Refresh token endpoint
    app.post('/api/refresh-token', async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });
        try {
            const result = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
            const storedToken = result.rows[0];
            if (!storedToken) return res.status(403).json({ error: 'Invalid refresh token' });
            jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
                if (err) return res.status(403).json({ error: 'Invalid or expired refresh token' });
                const newAccessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ token: newAccessToken });
            });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Profile picture upload endpoint
    app.post('/api/users/:id/profile-picture', authenticateJWT, upload.single('profile_picture'), async (req, res) => {
        try {
            if (req.user.id !== req.params.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const filePath = `/images/uploads/profile_pictures/${req.file.filename}`;
            await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [filePath, req.params.id]);
            res.json({ profile_picture_url: filePath });
        } catch (err) {
            res.status(500).json({ error: err.message || 'Failed to upload picture' });
        }
    });

    // Update user profile endpoint
    app.patch('/api/users/:id', authenticateJWT, async (req, res) => {
        try {
            if (req.user.id !== req.params.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const { name, bio, expertise, profile_picture_url } = req.body;
            const updates = {};
            if (name) updates.name = name;
            if (bio) updates.bio = bio;
            if (expertise) updates.expertise = expertise;
            if (profile_picture_url) updates.profile_picture_url = profile_picture_url;

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            const setClause = Object.keys(updates)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(', ');
            const values = Object.values(updates);

            const result = await pool.query(
                `UPDATE users SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
                [...values, req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Failed to update profile' });
        }
    });

    // Get user profile endpoint
    app.get('/api/users/:id', authenticateJWT, async (req, res) => {
        try {
            if (req.user.id !== req.params.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    });

    // Google OAuth endpoints
    app.get('/api/auth/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
    app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3000/login' }), async (req, res) => {
        try {
            const user = req.user;
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);
            res.redirect(`http://localhost:3000/auth/callback?token=${token}&refreshToken=${refreshToken}&id=${user.id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&profile_picture_url=${encodeURIComponent(user.profile_picture_url || '')}`);
        } catch (err) {
            res.redirect('http://localhost:3000/login?error=auth_failed');
        }
    });

    // GitHub OAuth endpoints
    app.get('/api/auth/github', passport.authenticate('github', { session: false, scope: ['user:email'] }));
    app.get('/api/auth/github/callback', passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:3000/login' }), async (req, res) => {
        try {
            const user = req.user;
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);
            res.redirect(`http://localhost:3000/auth/callback?token=${token}&refreshToken=${refreshToken}&id=${user.id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&profile_picture_url=${encodeURIComponent(user.profile_picture_url || '')}`);
        } catch (err) {
            res.redirect('http://localhost:3000/login?error=auth_failed');
        }
    });

    return { authenticateJWT };
};

module.exports.authenticateJWT = authenticateJWT;