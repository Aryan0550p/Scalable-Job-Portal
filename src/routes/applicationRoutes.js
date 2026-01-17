const express = require('express');
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  },
});

// All routes require authentication
router.use(authenticate);

// Job seeker routes
router.post('/', authorize('job_seeker'), applicationController.createApplication);
router.get('/my', authorize('job_seeker'), applicationController.getMyApplications);
router.get('/:id', applicationController.getApplication);
router.delete('/:id', authorize('job_seeker'), applicationController.withdrawApplication);

// Recruiter routes
router.get('/recruiter/all', authorize('recruiter'), applicationController.getRecruiterApplications);
router.get('/job/:jobId', authorize('recruiter'), applicationController.getJobApplications);
router.patch('/:id/status', authorize('recruiter'), applicationController.updateApplicationStatus);

module.exports = router;
