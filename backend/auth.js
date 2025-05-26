const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const pool = require('./db');
const crypto = require('crypto');
const { sendResetEmail } = require('./utils/email');

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

    // Forgot Password endpoint
    app.post('/api/forgot-password', async (req, res) => {
        const { email } = req.body;
        console.log('Received email:', email);
        try {
            const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
            if (userResult.rows.length === 0) {
                console.log('No user found for email:', email);
                return res.status(404).json({ message: 'Email not found' });
            }
            const user = userResult.rows[0];
            const token = crypto.randomBytes(32).toString('hex');
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
            console.log('Generated OTP:', otp);

            await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
            await pool.query(
                'INSERT INTO password_reset_tokens (user_id, token, otp, expires_at, email) VALUES ($1, $2, $3, $4, $5)',
                [user.id, token, otp, expiresAt, email]
            );

            // Verify token was saved
            const savedToken = await pool.query('SELECT * FROM password_reset_tokens WHERE otp = $1 AND email = $2', [otp, email]);
            console.log('Saved token:', savedToken.rows);

            await sendResetEmail(email, token, otp, expiresAt);
            res.json({ message: 'Password reset link and OTP sent to your email', redirect: `/otp.html?email=${encodeURIComponent(email)}` });
        } catch (error) {
            console.error('Error in forgot-password:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Resend OTP endpoint
    app.post('/api/resend-otp', async (req, res) => {
        const { email } = req.body;
        console.log('Resend OTP for email:', email);
        try {
            const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
            if (userResult.rows.length === 0) {
                console.log('No user found for email:', email);
                return res.status(404).json({ message: 'Email not found' });
            }
            const user = userResult.rows[0];
            const token = crypto.randomBytes(32).toString('hex');
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
            console.log('Generated OTP (resend):', otp);

            await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
            await pool.query(
                'INSERT INTO password_reset_tokens (user_id, token, otp, expires_at, email) VALUES ($1, $2, $3, $4, $5)',
                [user.id, token, otp, expiresAt, email]
            );

            // Verify token was saved
            const savedToken = await pool.query('SELECT * FROM password_reset_tokens WHERE otp = $1 AND email = $2', [otp, email]);
            console.log('Saved token (resend):', savedToken.rows);

            await sendResetEmail(email, token, otp, expiresAt);
            res.json({ message: 'New OTP and reset link sent to your email', redirect: `/otp.html?email=${encodeURIComponent(email)}` });
        } catch (error) {
            console.error('Error in resend-otp:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Verify OTP Endpoint
    app.post('/api/verify-otp', upload.none(), async (req, res) => {
        const { otp, email } = req.body;
        console.log('Received OTP for verification:', otp, 'for email:', email);
        try {
            // Log all tokens for debugging
            const allTokens = await pool.query('SELECT * FROM password_reset_tokens WHERE LOWER(email) = LOWER($1)', [email]);
            console.log('All tokens for email:', allTokens.rows);

            const tokenResult = await pool.query(
                'SELECT * FROM password_reset_tokens WHERE otp = $1 AND LOWER(email) = LOWER($2) AND expires_at > NOW()',
                [otp, email]
            );

            if (tokenResult.rows.length === 0) {
                console.log('No valid token found for OTP:', otp, 'and email:', email);
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }

            const resetToken = tokenResult.rows[0];
            console.log('Found valid token:', resetToken);

            // Update the verified status to true
            await pool.query(
                'UPDATE password_reset_tokens SET verified = TRUE WHERE id = $1',
                [resetToken.id]
            );

            // Verify the update
            const updatedToken = await pool.query(
                'SELECT * FROM password_reset_tokens WHERE id = $1',
                [resetToken.id]
            );
            console.log('Updated token:', updatedToken.rows[0]);

            res.json({ message: 'OTP verified', redirect: `/resetpass.html?token=${resetToken.token}`, email: resetToken.email });
        } catch (error) {
            console.error('Error in verify-otp:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    /// Reset Password Endpoint
    // app.post('/api/reset-password', upload.none(), async (req, res) => {
    //     const { token, password, confirmPassword } = req.body;
    //     console.log('Received reset password request:', { token, password, confirmPassword });

    //     if (!token || !password || !confirmPassword) {
    //         console.log('Missing fields in request');
    //         return res.status(400).json({ message: 'All fields are required' });
    //     }

    //     if (password !== confirmPassword) {
    //         console.log('Passwords do not match');
    //         return res.status(400).json({ message: 'Passwords do not match' });
    //     }

    //     try {
    //         // Log all tokens for debugging
    //         const allTokens = await pool.query('SELECT * FROM password_reset_tokens WHERE token = $1', [token]);
    //         console.log('All tokens for token:', allTokens.rows);

    //         const tokenResult = await pool.query(
    //             'SELECT * FROM password_reset_tokens WHERE token = $1 AND verified = TRUE AND expires_at > NOW()',
    //             [token]
    //         );

    //         if (tokenResult.rows.length === 0) {
    //             console.log('No valid token found for token:', token);
    //             return res.status(400).json({ message: 'Invalid, expired, or unverified token' });
    //         }

    //         const resetToken = tokenResult.rows[0];
    //         console.log('Found valid token:', resetToken);

    //         // Fetch user role from the users table
    //         const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [resetToken.user_id]);
    //         if (userResult.rows.length === 0) {
    //             console.log('No user found for user_id:', resetToken.user_id);
    //             return res.json({ message: 'Password reset successfully', redirect: '/login-signup.html' });
    //         }

    //         const user = userResult.rows[0];
    //         console.log('User role:', user.role);

    //         // Determine redirect URL based on user role
    //         let redirectUrl;
    //         switch (user.role) {
    //             case 'student':
    //                 redirectUrl = '/login-signup.html';
    //                 break;
    //             case 'admin':
    //                 redirectUrl = '/admin-signup-login.html';
    //                 break;
    //             case 'instructor':
    //                 redirectUrl = '/tutor-signup-login.html';
    //                 break;
    //             default:
    //                 redirectUrl = '/index.html'; // Fallback for invalid roles
    //         }

    //         const hashedPassword = await bcrypt.hash(password, 10);
    //         await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, resetToken.user_id]);
    //         await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetToken.id]);

    //         console.log('Password reset successfully for user_id:', resetToken.user_id, 'Redirecting to:', redirectUrl);
    //         res.json({ message: 'Password reset successfully', redirect: redirectUrl });
    //     } catch (error) {
    //         console.error('Error in reset-password:', error.stack);
    //         res.status(500).json({ message: 'Server error', error: error.message });
    //     }
    // });

    // Reset Password Endpoint
    app.post('/api/reset-password', upload.none(), async (req, res) => {
        const { token, password, confirmPassword } = req.body;
        console.log('Received reset password request:', { token, password, confirmPassword });

        if (!token || !password || !confirmPassword) {
            console.log('Missing fields in request');
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            console.log('Passwords do not match');
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        try {
            // Log all tokens for debugging
            const allTokens = await pool.query('SELECT * FROM password_reset_tokens WHERE token = $1', [token]);
            console.log('All tokens for token:', allTokens.rows);

            // Allow unverified tokens for link-based resets, but still check expiration
            const tokenResult = await pool.query(
                'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
                [token]
            );

            if (tokenResult.rows.length === 0) {
                console.log('No valid token found for token:', token);
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            const resetToken = tokenResult.rows[0];
            console.log('Found valid token:', resetToken);

            // Fetch user role from the users table
            const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [resetToken.user_id]);
            if (userResult.rows.length === 0) {
                console.log('No user found for user_id:', resetToken.user_id);
                return res.json({ message: 'Password reset successfully', redirect: '/login-signup.html' });
            }

            const user = userResult.rows[0];
            console.log('User role:', user.role);

            // Determine redirect URL based on user role
            let redirectUrl;
            switch (user.role) {
                case 'student':
                    redirectUrl = '/login-signup.html';
                    break;
                case 'admin':
                    redirectUrl = '/admin-signup-login.html';
                    break;
                case 'instructor':
                    redirectUrl = '/tutor-signup-login.html';
                    break;
                default:
                    redirectUrl = '/index.html'; // Fallback for invalid roles
            }


            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, resetToken.user_id]);
            await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetToken.id]);

            console.log('Password reset successfully for user_id:', resetToken.user_id, 'Redirecting to:', redirectUrl);
            res.json({ message: 'Password reset successfully', redirect: redirectUrl });
        } catch (error) {
            console.error('Error in reset-password:', error.stack);
            res.status(500).json({ message: 'Server error', error: error.message });
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

    app.post('/api/logout', authenticateJWT, async (req, res) => {
        try {
            await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
            res.json({ message: 'Logged out successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return { authenticateJWT };
};

module.exports.authenticateJWT = authenticateJWT;