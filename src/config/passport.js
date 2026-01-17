const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./database');
const logger = require('./logger');

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const result = await pool.query(
        'SELECT id, email, role, full_name FROM users WHERE id = $1 AND is_active = true',
        [payload.id]
      );

      if (result.rows.length === 0) {
        return done(null, false);
      }

      return done(null, result.rows[0]);
    } catch (error) {
      logger.error('JWT Strategy error:', error);
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const fullName = profile.displayName;

          // Check if user exists
          let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

          if (result.rows.length === 0) {
            // Create new user
            result = await pool.query(
              `INSERT INTO users (email, full_name, role, auth_provider, auth_provider_id, is_active, is_verified)
               VALUES ($1, $2, $3, $4, $5, true, true)
               RETURNING id, email, role, full_name`,
              [email, fullName, 'job_seeker', 'google', profile.id]
            );
          }

          return done(null, result.rows[0]);
        } catch (error) {
          logger.error('Google Strategy error:', error);
          return done(error, false);
        }
      }
    )
  );
}

module.exports = passport;
