app.post('/api/enroll', async (req, res) => {
    const { user_id, course_id } = req.body;
    try {
      await pool.query(
        'INSERT INTO enrollments (user_id, course_id, payment_status) VALUES ($1, $2, $3) RETURNING id',
        [user_id, course_id, 'pending']
      );
      res.status(201).json({ message: 'Enrollment successful' });
    } catch (err) {
      res.status(400).json({ error: 'Enrollment failed' });
    }
  });