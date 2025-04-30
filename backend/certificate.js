app.post('/api/certificates', async (req, res) => {
    const { user_id, course_id } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO certificates (user_id, course_id) VALUES ($1, $2) RETURNING certificate_id, certificate_url',
        [user_id, course_id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(400).json({ error: 'Certificate issuance failed' });
    }
  });