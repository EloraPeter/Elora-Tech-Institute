require('dotenv').config();
const express = require('express');
const cors = require('cors');
const auth = require('./auth');
const pay = require('./pay');

// Import route modules
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const certificateRoutes = require('./routes/certificates');
const enrollmentRoutes = require('./routes/enrollments');
const reportRoutes = require('./routes/reports');
const financialRoutes = require('./routes/financials');
const courseSubmissionRoutes = require('./routes/courseSubmissions');
const eventRoutes = require('./routes/events');
const discussionForumRoutes = require('./routes/discussionForums');
const assessmentRoutes = require('./routes/assessments');
const courseCompletionRoutes = require('./routes/courseCompletions');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Apply auth and pay routes
try {
  const { authenticateJWT } = auth(app);
  pay(app);
} catch (err) {
  console.error('Error initializing auth or pay:', err);
  process.exit(1);
}

// Mount route modules
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/course-submissions', courseSubmissionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/discussion-forums', discussionForumRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/course-completions', courseCompletionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));