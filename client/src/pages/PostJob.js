import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';

const PostJob = ({ user }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: user?.company_name || '',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: 'full_time',
    experience_level: 'mid',
    skills: '',
    requirements: '',
    benefits: '',
    remote_allowed: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert comma-separated strings to arrays
      const jobData = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        requirements: formData.requirements.split(',').map(r => r.trim()).filter(r => r),
        benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
      };

      await jobService.createJob(jobData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <h2>Post a New Job</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Job Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g. Senior Software Engineer"
          />
        </div>

        <div className="form-group">
          <label>Company *</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="e.g. New York, NY or Remote"
          />
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Job Type *</label>
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              required
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

          <div className="form-group">
            <label>Experience Level *</label>
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
              required
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Minimum Salary</label>
            <input
              type="number"
              name="salary_min"
              value={formData.salary_min}
              onChange={handleChange}
              placeholder="50000"
            />
          </div>

          <div className="form-group">
            <label>Maximum Salary</label>
            <input
              type="number"
              name="salary_max"
              value={formData.salary_max}
              onChange={handleChange}
              placeholder="80000"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Job Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="6"
            placeholder="Describe the role, responsibilities, and what you're looking for..."
          />
        </div>

        <div className="form-group">
          <label>Required Skills * (comma-separated)</label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            required
            placeholder="e.g. JavaScript, React, Node.js, MongoDB"
          />
        </div>

        <div className="form-group">
          <label>Requirements (comma-separated)</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows="3"
            placeholder="e.g. Bachelor's degree in CS, 3+ years experience, Strong communication skills"
          />
        </div>

        <div className="form-group">
          <label>Benefits (comma-separated)</label>
          <input
            type="text"
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
            placeholder="e.g. Health insurance, 401k, Remote work, Flexible hours"
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              name="remote_allowed"
              checked={formData.remote_allowed}
              onChange={handleChange}
              style={{ width: 'auto' }}
            />
            Remote Work Allowed
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;
