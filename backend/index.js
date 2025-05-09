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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Apply auth and pay routes
const { authenticateJWT } = auth(app);
pay(app);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));