const recommendationService = require('../services/recommendationService');
const logger = require('../config/logger');

class RecommendationController {
  async getRecommendations(req, res, next) {
    try {
      const { method = 'hybrid', limit = 10 } = req.query;
      
      const recommendations = await recommendationService.getRecommendations(
        req.user.id,
        method,
        parseInt(limit)
      );
      
      res.json({
        recommendations,
        method,
        user_id: req.user.id
      });
    } catch (error) {
      logger.error('Get recommendations error:', error);
      next(error);
    }
  }

  async trainModels(req, res, next) {
    try {
      const result = await recommendationService.trainModels();
      res.json(result);
    } catch (error) {
      logger.error('Train models error:', error);
      next(error);
    }
  }
}

module.exports = new RecommendationController();
