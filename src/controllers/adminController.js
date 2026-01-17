const analyticsService = require('../services/analyticsService');
const logger = require('../config/logger');

class AdminController {
  async getOverviewStats(req, res, next) {
    try {
      const stats = await analyticsService.getOverviewStats();
      res.json(stats);
    } catch (error) {
      logger.error('Get overview stats error:', error);
      next(error);
    }
  }

  async getJobStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await analyticsService.getJobStats({ startDate, endDate });
      res.json(stats);
    } catch (error) {
      logger.error('Get job stats error:', error);
      next(error);
    }
  }

  async getApplicationStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await analyticsService.getApplicationStats({ startDate, endDate });
      res.json(stats);
    } catch (error) {
      logger.error('Get application stats error:', error);
      next(error);
    }
  }

  async getUserGrowth(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const growth = await analyticsService.getUserGrowth(parseInt(days));
      res.json(growth);
    } catch (error) {
      logger.error('Get user growth error:', error);
      next(error);
    }
  }

  async getTopJobs(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const jobs = await analyticsService.getTopJobs(parseInt(limit));
      res.json(jobs);
    } catch (error) {
      logger.error('Get top jobs error:', error);
      next(error);
    }
  }

  async getTopRecruiters(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const recruiters = await analyticsService.getTopRecruiters(parseInt(limit));
      res.json(recruiters);
    } catch (error) {
      logger.error('Get top recruiters error:', error);
      next(error);
    }
  }

  async getSkillsInDemand(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const skills = await analyticsService.getSkillsInDemand(parseInt(limit));
      res.json(skills);
    } catch (error) {
      logger.error('Get skills in demand error:', error);
      next(error);
    }
  }

  async getLocationStats(req, res, next) {
    try {
      const stats = await analyticsService.getLocationStats();
      res.json(stats);
    } catch (error) {
      logger.error('Get location stats error:', error);
      next(error);
    }
  }

  async getConversionRates(req, res, next) {
    try {
      const rates = await analyticsService.getConversionRates();
      res.json(rates);
    } catch (error) {
      logger.error('Get conversion rates error:', error);
      next(error);
    }
  }

  async getRecruiterPerformance(req, res, next) {
    try {
      // Admin can view any recruiter, recruiters can only view their own
      const recruiterId = req.user.role === 'admin' 
        ? req.query.recruiterId || req.user.id
        : req.user.id;

      const performance = await analyticsService.getRecruiterPerformance(recruiterId);
      res.json(performance);
    } catch (error) {
      logger.error('Get recruiter performance error:', error);
      next(error);
    }
  }

  async getDashboardData(req, res, next) {
    try {
      const [overview, topJobs, topRecruiters, skills, locations] = await Promise.all([
        analyticsService.getOverviewStats(),
        analyticsService.getTopJobs(5),
        analyticsService.getTopRecruiters(5),
        analyticsService.getSkillsInDemand(10),
        analyticsService.getLocationStats()
      ]);

      res.json({
        overview,
        topJobs,
        topRecruiters,
        skillsInDemand: skills,
        locationStats: locations
      });
    } catch (error) {
      logger.error('Get dashboard data error:', error);
      next(error);
    }
  }
}

module.exports = new AdminController();
