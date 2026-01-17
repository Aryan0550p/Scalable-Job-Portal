const jobService = require('../services/jobService');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const { pool } = require('../config/database');
const logger = require('../config/logger');

class JobController {
  async createJob(req, res, next) {
    try {
      const job = await jobService.createJob(req.user.id, req.body);
      
      // Invalidate cache
      await cacheDel('jobs:all:*');
      
      res.status(201).json(job);
    } catch (error) {
      logger.error('Create job error:', error);
      next(error);
    }
  }

  async getJob(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;
      
      const cacheKey = `job:${id}:${userId}`;
      
      // Try cache first
      let job = await cacheGet(cacheKey);
      
      if (!job) {
        job = await jobService.getJobById(id, userId);
        await cacheSet(cacheKey, job, 300); // Cache for 5 minutes
      }
      
      res.json(job);
    } catch (error) {
      logger.error('Get job error:', error);
      next(error);
    }
  }

  async getAllJobs(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      
      const cacheKey = `jobs:all:${JSON.stringify({ page, limit, filters })}`;
      
      // Try cache first
      let result = await cacheGet(cacheKey);
      
      if (!result) {
        result = await jobService.getAllJobs(filters, parseInt(page), parseInt(limit));
        await cacheSet(cacheKey, result, 300); // Cache for 5 minutes
      }
      
      res.json(result);
    } catch (error) {
      logger.error('Get all jobs error:', error);
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const { id } = req.params;
      const job = await jobService.updateJob(id, req.user.id, req.body);
      
      // Invalidate cache
      await cacheDel(`job:${id}:*`);
      await cacheDel('jobs:all:*');
      
      res.json(job);
    } catch (error) {
      logger.error('Update job error:', error);
      next(error);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const { id } = req.params;
      const job = await jobService.deleteJob(id, req.user.id);
      
      // Invalidate cache
      await cacheDel(`job:${id}:*`);
      await cacheDel('jobs:all:*');
      
      res.json({ message: 'Job closed successfully', job });
    } catch (error) {
      logger.error('Delete job error:', error);
      next(error);
    }
  }

  async getMyJobs(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const jobs = await jobService.getRecruiterJobs(req.user.id, parseInt(page), parseInt(limit));
      res.json({ jobs });
    } catch (error) {
      logger.error('Get my jobs error:', error);
      next(error);
    }
  }

  async saveJob(req, res, next) {
    try {
      const { id } = req.params;
      
      await pool.query(
        'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, id]
      );
      
      // Track activity
      await pool.query(
        `INSERT INTO user_activity (user_id, job_id, activity_type) VALUES ($1, $2, 'save')`,
        [req.user.id, id]
      );
      
      res.json({ message: 'Job saved successfully' });
    } catch (error) {
      logger.error('Save job error:', error);
      next(error);
    }
  }

  async unsaveJob(req, res, next) {
    try {
      const { id } = req.params;
      
      await pool.query(
        'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
        [req.user.id, id]
      );
      
      res.json({ message: 'Job unsaved successfully' });
    } catch (error) {
      logger.error('Unsave job error:', error);
      next(error);
    }
  }

  async getSavedJobs(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const result = await pool.query(
        `SELECT j.*, sj.saved_date
         FROM saved_jobs sj
         JOIN jobs j ON sj.job_id = j.id
         WHERE sj.user_id = $1
         ORDER BY sj.saved_date DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );
      
      res.json(result.rows);
    } catch (error) {
      logger.error('Get saved jobs error:', error);
      next(error);
    }
  }
}

module.exports = new JobController();
