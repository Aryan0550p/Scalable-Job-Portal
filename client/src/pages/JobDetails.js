import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService, applicationService } from '../services/api';

const JobDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobService.getJobById(id);
      setJob(response.data.job || response.data);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to fetch job details');
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setApplying(true);
    try {
      await applicationService.apply(id);
      setMessage('Application submitted successfully!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container">
        <p>Job not found</p>
      </div>
    );
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max.toLocaleString()}`;
  };

  return (
    <div className="container">
      <div className="job-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1>{job.title}</h1>
        <p className="company">{job.company_name || 'Company Name'}</p>
        <p className="location">📍 {job.location}</p>
        <p className="salary">💰 {formatSalary(job.salary_min, job.salary_max)}</p>
        
        <div className="job-tags" style={{ margin: '1.5rem 0' }}>
          <span className="tag">{job.job_type}</span>
          <span className="tag">{job.experience_level}</span>
          <span className="tag">{job.status}</span>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>Job Description</h3>
          <p style={{ lineHeight: '1.6', color: '#666', marginTop: '1rem' }}>
            {job.description}
          </p>
        </div>

        {job.requirements && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Requirements</h3>
            <p style={{ lineHeight: '1.6', color: '#666', marginTop: '1rem' }}>
              {job.requirements}
            </p>
          </div>
        )}

        {message && (
          <div className={message.includes('success') ? 'success-message' : 'error-message'} style={{ marginTop: '1rem' }}>
            {message}
          </div>
        )}

        <button 
          onClick={handleApply}
          className="btn btn-primary"
          style={{ marginTop: '2rem', width: '100%' }}
          disabled={applying || !user || user.role !== 'job_seeker'}
        >
          {applying ? 'Applying...' : user ? 'Apply Now' : 'Login to Apply'}
        </button>
      </div>
    </div>
  );
};

export default JobDetails;
