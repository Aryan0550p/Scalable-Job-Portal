import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';

const Jobs = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobService.getAllJobs();
      setJobs(response.data.jobs || response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch jobs');
      setLoading(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Available Jobs</h1>
      {jobs.length === 0 ? (
        <p>No jobs available at the moment.</p>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="job-card"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <h3>{job.title}</h3>
              <p className="company">{job.company_name || 'Company Name'}</p>
              <p className="location">📍 {job.location}</p>
              <p className="salary">💰 {formatSalary(job.salary_min, job.salary_max)}</p>
              <p className="description">
                {job.description?.substring(0, 100)}...
              </p>
              <div className="job-tags">
                <span className="tag">{job.job_type}</span>
                <span className="tag">{job.experience_level}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
