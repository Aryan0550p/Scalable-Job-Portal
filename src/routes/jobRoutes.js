const express = require('express');
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', jobController.getAllJobs);

// Protected routes - All authenticated users
router.use(authenticate);

// Recruiter routes (must come before /:id route)
router.get('/recruiter/my', authorize('recruiter'), jobController.getMyJobs);
router.post('/', authorize('recruiter'), jobController.createJob);
router.put('/:id', authorize('recruiter'), jobController.updateJob);
router.delete('/:id', authorize('recruiter'), jobController.deleteJob);

// Job seeker routes
router.get('/saved/list', authorize('job_seeker'), jobController.getSavedJobs);
router.post('/:id/save', authorize('job_seeker'), jobController.saveJob);
router.delete('/:id/save', authorize('job_seeker'), jobController.unsaveJob);

// Public authenticated route (must be last because it uses :id parameter)
router.get('/:id', jobController.getJob);

module.exports = router;
