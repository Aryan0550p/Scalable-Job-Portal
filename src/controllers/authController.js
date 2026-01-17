const authService = require('../services/authService');
const logger = require('../config/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  async googleCallback(req, res) {
    try {
      const accessToken = authService.generateAccessToken(req.user);
      const refreshToken = authService.generateRefreshToken(req.user);

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
    } catch (error) {
      logger.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  async getProfile(req, res) {
    res.json({ user: req.user });
  }
}

module.exports = new AuthController();
