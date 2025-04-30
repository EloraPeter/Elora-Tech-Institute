require('dotenv').config();
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const pool = require('./db');
const auth = require('./auth');

module.exports = (app) => {
  const { authenticateJWT } = auth(app);

  app.post('/api/payments', authenticateJWT, async (req, res) => {
    const { user_id, course_id, amount, email } = req.body;

    if (!user_id || !course_id || !amount || !email) {
      return res.status(400).json({ error: 'user_id, course_id, amount, and email are required' });
    }

    if (req.user.id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized user' });
    }

    try {
      const course = await pool.query('SELECT * FROM courses WHERE id = $1', [course_id]);
      if (course.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const response = await paystack.transaction.initialize({
        email,
        amount: amount * 100,
        callback_url: `http://localhost:3000/confirmation.html?course_id=${course_id}`,
        metadata: { user_id, course_id }
      });

      await pool.query(
        'INSERT INTO payments (user_id, course_id, paystack_reference, amount, status) VALUES ($1, $2, $3, $4, $5)',
        [user_id, course_id, response.data.reference, amount, 'pending']
      );

      res.json({ payment_url: response.data.authorization_url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Payment initiation failed' });
    }
  });

  app.get('/api/payments/verify/:reference', authenticateJWT, async (req, res) => {
    const { reference } = req.params;

    try {
      const payment = await pool.query('SELECT * FROM payments WHERE paystack_reference = $1', [reference]);
      if (!payment.rows[0]) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (req.user.id !== payment.rows[0].user_id) {
        return res.status(403).json({ error: 'Unauthorized user' });
      }

      const response = await paystack.transaction.verify(reference);
      const status = response.data.status;

      await pool.query(
        'UPDATE payments SET status = $1 WHERE paystack_reference = $2',
        [status, reference]
      );

      if (status === 'success') {
        const { user_id, course_id } = payment.rows[0];
        await pool.query(
          'INSERT INTO enrollments (user_id, course_id, payment_status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [user_id, course_id, 'completed']
        );
      }

      res.json({ status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Verification failed' });
    }
  });
};