const { pool } = require('../config/database');
const logger = require('../config/logger');

class JobService {
  async createJob(recruiterId, jobData) {
    const {
      title,
      description,
      company,
      location,
      salary_min,
      salary_max,
      job_type,
      experience_level,
      skills,
      requirements,
      benefits,
      remote_allowed,
      closing_date,
    } = jobData;

    const result = await pool.query(
      `INSERT INTO jobs (
        recruiter_id, title, description, company, location,
        salary_min, salary_max, job_type, experience_level,
        skills, requirements, benefits, remote_allowed, closing_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active')
      RETURNING *`,
      [
        recruiterId,
        title,
        description,
        company,
        location,
        salary_min,
        salary_max,
        job_type,
        experience_level,
        skills,
        requirements,
        benefits,
        remote_allowed,
        closing_date,
      ]
    );

    logger.info(`Job created: ${result.rows[0].id}`);
    return result.rows[0];
  }

  async getJobById(jobId, userId = null) {
    const result = await pool.query(
      `SELECT j.*, u.full_name as recruiter_name, u.company_name,
              EXISTS(SELECT 1 FROM saved_jobs WHERE job_id = j.id AND user_id = $2) as is_saved,
              EXISTS(SELECT 1 FROM applications WHERE job_id = j.id AND applicant_id = $2) as has_applied
       FROM jobs j
       JOIN users u ON j.recruiter_id = u.id
       WHERE j.id = $1`,
      [jobId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Job not found');
    }

    // Increment view count
    await pool.query('UPDATE jobs SET views_count = views_count + 1 WHERE id = $1', [jobId]);

    // Track view activity
    if (userId) {
      await pool.query(
        `INSERT INTO user_activity (user_id, job_id, activity_type)
         VALUES ($1, $2, 'view')`,
        [userId, jobId]
      );
    }

    return result.rows[0];
  }

  async getAllJobs(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT j.*, u.full_name as recruiter_name, u.company_name
      FROM jobs j
      JOIN users u ON j.recruiter_id = u.id
      WHERE j.status = 'active'
    `;
    const params = [];
    let paramCount = 1;

    if (filters.location) {
      query += ` AND j.location ILIKE $${paramCount}`;
      params.push(`%${filters.location}%`);
      paramCount++;
    }

    if (filters.job_type) {
      query += ` AND j.job_type = $${paramCount}`;
      params.push(filters.job_type);
      paramCount++;
    }

    if (filters.experience_level) {
      query += ` AND j.experience_level = $${paramCount}`;
      params.push(filters.experience_level);
      paramCount++;
    }

    if (filters.salary_min) {
      query += ` AND j.salary_max >= $${paramCount}`;
      params.push(filters.salary_min);
      paramCount++;
    }

    if (filters.remote_allowed) {
      query += ` AND j.remote_allowed = true`;
    }

    if (filters.skills && filters.skills.length > 0) {
      query += ` AND j.skills && $${paramCount}::text[]`;
      params.push(filters.skills);
      paramCount++;
    }

    query += ` ORDER BY j.posted_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM jobs WHERE status = $1',
      ['active']
    );

    return {
      jobs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    };
  }

  async updateJob(jobId, recruiterId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(jobId, recruiterId);

    const result = await pool.query(
      `UPDATE jobs SET ${fields.join(', ')}
       WHERE id = $${paramCount} AND recruiter_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Job not found or unauthorized');
    }

    return result.rows[0];
  }

  async deleteJob(jobId, recruiterId) {
    const result = await pool.query(
      'UPDATE jobs SET status = $1 WHERE id = $2 AND recruiter_id = $3 RETURNING *',
      ['closed', jobId, recruiterId]
    );

    if (result.rows.length === 0) {
      throw new Error('Job not found or unauthorized');
    }

    return result.rows[0];
  }

  async getRecruiterJobs(recruiterId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT j.*, COUNT(a.id) as applications_count
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.recruiter_id = $1
       GROUP BY j.id
       ORDER BY j.posted_date DESC
       LIMIT $2 OFFSET $3`,
      [recruiterId, limit, offset]
    );

    return result.rows;
  }
}

module.exports = new JobService();
