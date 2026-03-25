// server/routes/supportRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../auth'); // Assuming auth.js exports this

// In-memory storage (replace with a database in production)
let supportTickets = [];
let feedback = [];

// Create a new support ticket
router.post('/tickets', authenticateJWT, (req, res) => {
  const { role, category, subject, email, message } = req.body;
  if (!role || !category || !subject || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const ticket = {
    id: supportTickets.length + 1,
    userId: req.user.id, // Assuming authenticateJWT adds user to req
    role,
    category,
    subject,
    email,
    message,
    status: 'Open',
    timestamp: new Date().toISOString()
  };
  supportTickets.push(ticket);
  res.status(201).json({ message: 'Ticket submitted successfully', ticket });
});

// Get support tickets (Admins only)
router.get('/tickets', authenticateJWT, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(supportTickets);
});

// Submit feedback
router.post('/feedback', authenticateJWT, (req, res) => {
  const { rating, message } = req.body;
  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  const feedbackEntry = {
    id: feedback.length + 1,
    userId: req.user.id,
    rating,
    message: message || '',
    timestamp: new Date().toISOString()
  };
  feedback.push(feedbackEntry);
  res.status(201).json({ message: 'Feedback submitted successfully' });
});

module.exports = router;