const axios = require('axios');
const logger = require('../config/logger');
const { cacheGet, cacheSet } = require('../config/redis');

class RecommendationService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    this.mlServiceEnabled = process.env.ML_SERVICE_ENABLED === 'true';
  }

  async getRecommendations(userId, method = 'hybrid', limit = 10) {
    if (!this.mlServiceEnabled) {
      logger.warn('ML service is disabled');
      return [];
    }

    try {
      // Check cache first
      const cacheKey = `recommendations:${userId}:${method}:${limit}`;
      const cached = await cacheGet(cacheKey);

      if (cached) {
        return cached;
      }

      // Call ML service
      const response = await axios.post(
        `${this.mlServiceUrl}/api/recommend/${method}`,
        { user_id: userId, limit },
        { timeout: 10000 }
      );

      const recommendations = response.data.recommendations;

      // Cache for 1 hour
      await cacheSet(cacheKey, recommendations, 3600);

      return recommendations;
    } catch (error) {
      logger.error('Error getting recommendations:', error.message);
      return [];
    }
  }

  async getContentBasedRecommendations(userId, limit = 10) {
    return this.getRecommendations(userId, 'content-based', limit);
  }

  async getCollaborativeRecommendations(userId, limit = 10) {
    return this.getRecommendations(userId, 'collaborative', limit);
  }

  async getHybridRecommendations(userId, limit = 10) {
    return this.getRecommendations(userId, 'hybrid', limit);
  }

  async trainModels() {
    if (!this.mlServiceEnabled) {
      throw new Error('ML service is disabled');
    }

    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/recommend/train`,
        {},
        { timeout: 60000 }
      );

      return response.data;
    } catch (error) {
      logger.error('Error training models:', error.message);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
