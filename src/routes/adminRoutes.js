const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// Admin-only analytics endpoints
router.get('/dashboard', authorize('admin'), adminController.getDashboardData);
router.get('/stats/overview', authorize('admin'), adminController.getOverviewStats);
router.get('/stats/jobs', authorize('admin'), adminController.getJobStats);
router.get('/stats/applications', authorize('admin'), adminController.getApplicationStats);
router.get('/stats/user-growth', authorize('admin'), adminController.getUserGrowth);
router.get('/stats/top-jobs', authorize('admin'), adminController.getTopJobs);
router.get('/stats/top-recruiters', authorize('admin'), adminController.getTopRecruiters);
router.get('/stats/skills', authorize('admin'), adminController.getSkillsInDemand);
router.get('/stats/locations', authorize('admin'), adminController.getLocationStats);
router.get('/stats/conversion', authorize('admin'), adminController.getConversionRates);

// Recruiter can view their own performance
router.get('/performance', authorize('admin', 'recruiter'), adminController.getRecruiterPerformance);

module.exports = router;
