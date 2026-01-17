const searchService = require('../services/searchService');
const logger = require('../config/logger');
const { pool } = require('../config/database');

class SearchController {
  async search(req, res, next) {
    try {
      const { q, page = 1, limit = 20, ...filters } = req.query;

      const result = await searchService.searchJobs(
        q,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      // Track search activity
      if (req.user) {
        await pool.query(
          `INSERT INTO user_activity (user_id, activity_type, activity_data)
           VALUES ($1, 'search', $2)`,
          [req.user.id, JSON.stringify({ query: q, filters })]
        );
      }

      res.json(result);
    } catch (error) {
      logger.error('Search error:', error);
      next(error);
    }
  }

  async suggest(req, res, next) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json({ suggestions: [] });
      }

      const suggestions = await searchService.suggestJobs(q);
      res.json({ suggestions });
    } catch (error) {
      logger.error('Suggest error:', error);
      next(error);
    }
  }

  async reindex(req, res, next) {
    try {
      await searchService.bulkIndexJobs();
      res.json({ message: 'Jobs reindexed successfully' });
    } catch (error) {
      logger.error('Reindex error:', error);
      next(error);
    }
  }
}

module.exports = new SearchController();
