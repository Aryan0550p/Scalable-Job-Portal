const { pool } = require('../config/database');
const logger = require('../config/logger');

class ApplicationService {
  async createApplication(applicantId, applicationData) {
    const { job_id, resume_url, cover_letter } = applicationData;

    // Check if already applied
    const existing = await pool.query(
      'SELECT id FROM applications WHERE job_id = $1 AND applicant_id = $2',
      [job_id, applicantId]
    );

    if (existing.rows.length > 0) {
      throw new Error('You have already applied to this job');
    }

    // Check if job is active
    const job = await pool.query('SELECT id, status FROM jobs WHERE id = $1', [job_id]);

    if (job.rows.length === 0 || job.rows[0].status !== 'active') {
      throw new Error('Job is not available for applications');
    }

    const result = await pool.query(
      `INSERT INTO applications (job_id, applicant_id, resume_url, cover_letter)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [job_id, applicantId, resume_url, cover_letter]
    );

    // Increment application count
    await pool.query(
      'UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1',
      [job_id]
    );

    // Track activity
    await pool.query(
      `INSERT INTO user_activity (user_id, job_id, activity_type)
       VALUES ($1, $2, 'apply')`,
      [applicantId, job_id]
    );

    logger.info(`Application created: ${result.rows[0].id}`);
    return result.rows[0];
  }

  async getApplicationById(applicationId, userId, userRole) {
    let query = `
      SELECT a.*, j.title as job_title, j.company, j.location,
             u.full_name as applicant_name, u.email as applicant_email,
             jsp.resume_url as profile_resume, jsp.skills
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.applicant_id = u.id
      LEFT JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
      WHERE a.id = $1
    `;

    const params = [applicationId];

    // Authorization check
    if (userRole === 'job_seeker') {
      query += ' AND a.applicant_id = $2';
      params.push(userId);
    } else if (userRole === 'recruiter') {
      query += ' AND j.recruiter_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw new Error('Application not found or unauthorized');
    }

    return result.rows[0];
  }

  async getUserApplications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT a.*, j.title, j.company, j.location, j.job_type
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.applicant_id = $1
       ORDER BY a.applied_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  async getJobApplications(jobId, recruiterId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Verify recruiter owns the job
    const job = await pool.query(
      'SELECT id FROM jobs WHERE id = $1 AND recruiter_id = $2',
      [jobId, recruiterId]
    );

    if (job.rows.length === 0) {
      throw new Error('Job not found or unauthorized');
    }

    const result = await pool.query(
      `SELECT a.*, u.full_name, u.email, u.phone,
              jsp.resume_url, jsp.skills, jsp.experience_years
       FROM applications a
       JOIN users u ON a.applicant_id = u.id
       LEFT JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
       WHERE a.job_id = $1
       ORDER BY a.applied_date DESC
       LIMIT $2 OFFSET $3`,
      [jobId, limit, offset]
    );

    return result.rows;
  }

  async updateApplicationStatus(applicationId, recruiterId, status) {
    // Verify recruiter owns the job
    const result = await pool.query(
      `UPDATE applications a
       SET status = $1
       FROM jobs j
       WHERE a.id = $2 AND a.job_id = j.id AND j.recruiter_id = $3
       RETURNING a.*`,
      [status, applicationId, recruiterId]
    );

    if (result.rows.length === 0) {
      throw new Error('Application not found or unauthorized');
    }

    // Create notification for applicant
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id)
       SELECT a.applicant_id, 'Application Update',
              'Your application status has been updated to: ' || $1,
              'application_update', a.id
       FROM applications a
       WHERE a.id = $2`,
      [status, applicationId]
    );

    return result.rows[0];
  }

  async withdrawApplication(applicationId, userId) {
    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND applicant_id = $2 RETURNING job_id',
      [applicationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Application not found or unauthorized');
    }

    // Decrement application count
    await pool.query(
      'UPDATE jobs SET applications_count = applications_count - 1 WHERE id = $1',
      [result.rows[0].job_id]
    );

    return { message: 'Application withdrawn successfully' };
  }

  async getRecruiterApplications(recruiterId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT a.*, 
              j.title as job_title, 
              u.full_name as applicant_name, 
              u.email as applicant_email,
              jsp.resume_url, 
              jsp.skills, 
              jsp.experience_years
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.applicant_id = u.id
       LEFT JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
       WHERE j.recruiter_id = $1
       ORDER BY a.applied_date DESC
       LIMIT $2 OFFSET $3`,
      [recruiterId, limit, offset]
    );

    return result.rows;
  }
}

module.exports = new ApplicationService();
