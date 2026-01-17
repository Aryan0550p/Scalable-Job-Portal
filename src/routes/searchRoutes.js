const express = require('express');
const searchController = require('../controllers/searchController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public search
router.get('/', searchController.search);
router.get('/suggest', searchController.suggest);

// Admin only - reindex all jobs
router.post('/reindex', authenticate, authorize('admin'), searchController.reindex);

module.exports = router;
