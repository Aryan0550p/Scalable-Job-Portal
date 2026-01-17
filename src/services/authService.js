const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../config/logger');

class AuthService {
  async register(userData) {
    const { email, password, full_name, role, phone, company_name } = userData;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password, full_name, role, phone, company_name, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, true, false)
       RETURNING id, email, full_name, role, created_at`,
      [email, hashedPassword, full_name, role, phone, company_name]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, user.id]
    );

    logger.info(`New user registered: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  async login(email, password) {
    // Find user
    const result = await pool.query(
      'SELECT id, email, password, full_name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Update last login and refresh token
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, refresh_token = $1 WHERE id = $2',
      [refreshToken, user.id]
    );

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const result = await pool.query(
        'SELECT id, email, full_name, role FROM users WHERE id = $1 AND refresh_token = $2 AND is_active = true',
        [decoded.id, refreshToken]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const user = result.rows[0];
      const newAccessToken = this.generateAccessToken(user);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async logout(userId) {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);
    logger.info(`User logged out: ${userId}`);
  }

  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
  }
}

module.exports = new AuthService();
