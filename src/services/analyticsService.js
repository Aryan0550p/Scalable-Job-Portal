const { pool } = require('../config/database');
const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../config/logger');

class AnalyticsService {
  async getOverviewStats() {
    const cacheKey = 'analytics:overview';
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return cached;
    }

    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'job_seeker') as total_job_seekers,
        (SELECT COUNT(*) FROM users WHERE role = 'recruiter') as total_recruiters,
        (SELECT COUNT(*) FROM jobs WHERE status = 'active') as active_jobs,
        (SELECT COUNT(*) FROM jobs) as total_jobs,
        (SELECT COUNT(*) FROM applications) as total_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'accepted') as accepted_applications,
        (SELECT AVG(applications_count) FROM jobs WHERE status = 'active') as avg_applications_per_job
    `);

    const result = stats.rows[0];
    await cacheSet(cacheKey, result, 600); // Cache for 10 minutes

    return result;
  }

  async getJobStats(filters = {}) {
    let query = `
      SELECT 
        job_type,
        experience_level,
        COUNT(*) as count,
        AVG(salary_min) as avg_salary_min,
        AVG(salary_max) as avg_salary_max,
        AVG(applications_count) as avg_applications
      FROM jobs
      WHERE status = 'active'
    `;

    const params = [];
    let paramCount = 1;

    if (filters.startDate) {
      query += ` AND posted_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND posted_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ` GROUP BY job_type, experience_level ORDER BY count DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getApplicationStats(filters = {}) {
    let query = `
      SELECT 
        DATE_TRUNC('day', applied_date) as date,
        status,
        COUNT(*) as count
      FROM applications
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.startDate) {
      query += ` AND applied_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND applied_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ` GROUP BY DATE_TRUNC('day', applied_date), status ORDER BY date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getUserGrowth(days = 30) {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        role,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', created_at), role
      ORDER BY date DESC
    `);

    return result.rows;
  }

  async getTopJobs(limit = 10) {
    const result = await pool.query(`
      SELECT 
        j.id,
        j.title,
        j.company,
        j.location,
        j.posted_date,
        j.applications_count,
        j.views_count,
        u.full_name as recruiter_name
      FROM jobs j
      JOIN users u ON j.recruiter_id = u.id
      WHERE j.status = 'active'
      ORDER BY j.applications_count DESC, j.views_count DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  async getTopRecruiters(limit = 10) {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.full_name,
        u.company_name,
        u.email,
        COUNT(j.id) as jobs_posted,
        SUM(j.applications_count) as total_applications,
        AVG(j.views_count) as avg_views
      FROM users u
      JOIN jobs j ON u.id = j.recruiter_id
      WHERE u.role = 'recruiter' AND j.status = 'active'
      GROUP BY u.id, u.full_name, u.company_name, u.email
      ORDER BY jobs_posted DESC, total_applications DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  async getSkillsInDemand(limit = 20) {
    const result = await pool.query(`
      SELECT 
        UNNEST(skills) as skill,
        COUNT(*) as job_count,
        AVG(salary_max) as avg_salary
      FROM jobs
      WHERE status = 'active'
      GROUP BY skill
      ORDER BY job_count DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  async getLocationStats() {
    const result = await pool.query(`
      SELECT 
        location,
        COUNT(*) as job_count,
        AVG(salary_min) as avg_salary_min,
        AVG(salary_max) as avg_salary_max
      FROM jobs
      WHERE status = 'active' AND location IS NOT NULL
      GROUP BY location
      ORDER BY job_count DESC
      LIMIT 15
    `);

    return result.rows;
  }

  async getConversionRates() {
    const result = await pool.query(`
      SELECT 
        j.id,
        j.title,
        j.views_count,
        j.applications_count,
        CASE 
          WHEN j.views_count > 0 THEN 
            ROUND((j.applications_count::numeric / j.views_count::numeric) * 100, 2)
          ELSE 0
        END as conversion_rate
      FROM jobs j
      WHERE j.status = 'active' AND j.views_count > 0
      ORDER BY conversion_rate DESC
      LIMIT 20
    `);

    return result.rows;
  }

  async getRecruiterPerformance(recruiterId) {
    const overview = await pool.query(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(applications_count) as total_applications,
        AVG(applications_count) as avg_applications_per_job,
        SUM(views_count) as total_views
      FROM jobs
      WHERE recruiter_id = $1
    `, [recruiterId]);

    const jobsList = await pool.query(`
      SELECT 
        j.id,
        j.title,
        j.posted_date,
        j.status,
        j.applications_count,
        j.views_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'pending') as pending_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') as accepted_count
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.recruiter_id = $1
      GROUP BY j.id, j.title, j.posted_date, j.status, j.applications_count, j.views_count
      ORDER BY j.posted_date DESC
    `, [recruiterId]);

    return {
      overview: overview.rows[0],
      jobs: jobsList.rows
    };
  }
}

module.exports = new AnalyticsService();
