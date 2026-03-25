// server/routes/docsRoutes.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateJWT } = require('../auth'); // Assuming auth.js exports this

const docs = {
  '1': 'Student Getting Started Guide',
  '2': 'Tutor Getting Started Guide',
  '3': 'Admin User Manual',
  '4': 'Course Creation Tutorial',
  '5': 'Platform Policies'
};

const docsDir = path.join(__dirname, '../../docs'); // Ensure a 'docs' folder exists with PDF files

// Download Documentation
router.get('/download/:id', authenticateJWT, (req, res) => {
  const id = req.params.id;
  const fileName = `${docs[id]}.pdf`;
  const filePath = path.join(docsDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).json({ error: 'Error downloading file' });
    }
  });
});

module.exports = router;