const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get personalized job recommendations
router.get('/', authorize('job_seeker'), recommendationController.getRecommendations);

// Train models (admin only)
router.post('/train', authorize('admin'), recommendationController.trainModels);

module.exports = router;
