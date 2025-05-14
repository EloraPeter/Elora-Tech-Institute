const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
require('dotenv').config();
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth credentials are not defined');
}
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error('GitHub OAuth credentials are not defined');
}

// Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
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
    // Check if user exists by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
    let user = result.rows[0];

    if (!user) {
      // Create new user
      const result = await pool.query(
        'INSERT INTO users (name, email, role, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
        [profile.displayName, profile.emails[0].value, 'student', 'google', profile.id]
      );
      user = result.rows[0];
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
    // GitHub may not always return an email, use profile.emails[0]?.value or fallback
    const email = profile.emails[0]?.value || `${profile.id}@github.com`; // Fallback email
    // Check if user exists by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      // Create new user
      const result = await pool.query(
        'INSERT INTO users (name, email, role, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
        [profile.displayName || profile.username, email, 'student', 'github', profile.id]
      );
      user = result.rows[0];
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Serialize user to session (minimal data)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = (app) => {
  // Initialize Passport
  app.use(passport.initialize());

  // Register endpoint (existing)
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
      console.error(err);
      res.status(400).json({ error: 'Email already exists or invalid email' });
    }
  });

  // Login endpoint (existing)
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

      res.json({
        message: 'Login successful',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
        refreshToken,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Refresh token endpoint (existing)
  app.post('/api/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
      const result = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
      const storedToken = result.rows[0];
      if (!storedToken) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }

        const newAccessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.json({ token: newAccessToken });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Google OAuth endpoints
  app.get('/api/auth/google',
    passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3000/login' }),
    async (req, res) => {
      try {
        const user = req.user;
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

        // Redirect to frontend with token and user info
        res.redirect(`http://localhost:3000/auth/callback?token=${token}&refreshToken=${refreshToken}&id=${user.id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}`);
      } catch (err) {
        console.error(err);
        res.redirect('http://localhost:3000/login?error=auth_failed');
      }
    }
  );

  // GitHub OAuth endpoints
  app.get('/api/auth/github',
    passport.authenticate('github', { session: false, scope: ['user:email'] })
  );

  app.get('/api/auth/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:3000/login' }),
    async (req, res) => {
      try {
        const user = req.user;
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

        // Redirect to frontend with token and user info
        res.redirect(`http://localhost:3000/auth/callback?token=${token}&refreshToken=${refreshToken}&id=${user.id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}`);
      } catch (err) {
        console.error(err);
        res.redirect('http://localhost:3000/login?error=auth_failed');
      }
    }
  );

  return { authenticateJWT };
};

// Export authenticateJWT directly
module.exports.authenticateJWT = authenticateJWT;