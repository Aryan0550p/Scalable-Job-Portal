const applicationService = require('../services/applicationService');
const logger = require('../config/logger');

class ApplicationController {
  async createApplication(req, res, next) {
    try {
      const application = await applicationService.createApplication(req.user.id, req.body);
      res.status(201).json(application);
    } catch (error) {
      logger.error('Create application error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getApplication(req, res, next) {
    try {
      const { id } = req.params;
      const application = await applicationService.getApplicationById(
        id,
        req.user.id,
        req.user.role
      );
      res.json(application);
    } catch (error) {
      logger.error('Get application error:', error);
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const applications = await applicationService.getUserApplications(
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );
      res.json({ applications });
    } catch (error) {
      logger.error('Get my applications error:', error);
      next(error);
    }
  }

  async getJobApplications(req, res, next) {
    try {
      const { jobId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const applications = await applicationService.getJobApplications(
        jobId,
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );
      
      res.json(applications);
    } catch (error) {
      logger.error('Get job applications error:', error);
      next(error);
    }
  }

  async updateApplicationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const application = await applicationService.updateApplicationStatus(
        id,
        req.user.id,
        status
      );
      
      res.json(application);
    } catch (error) {
      logger.error('Update application status error:', error);
      next(error);
    }
  }

  async withdrawApplication(req, res, next) {
    try {
      const { id } = req.params;
      const result = await applicationService.withdrawApplication(id, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Withdraw application error:', error);
      next(error);
    }
  }

  async getRecruiterApplications(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const applications = await applicationService.getRecruiterApplications(
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );
      res.json({ applications });
    } catch (error) {
      logger.error('Get recruiter applications error:', error);
      next(error);
    }
  }
}

module.exports = new ApplicationController();
