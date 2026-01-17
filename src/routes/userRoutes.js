const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Placeholder for user routes
router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
