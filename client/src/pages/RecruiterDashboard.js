import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jobService, applicationService } from '../services/api';

const RecruiterDashboard = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('jobs');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchRecruiterData();
  }, [location.key]);

  const fetchRecruiterData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch recruiter's posted jobs
      console.log('Fetching recruiter jobs...');
      const jobsResponse = await jobService.getRecruiterJobs();
      console.log('Jobs response:', jobsResponse.data);
      setJobs(jobsResponse.data.jobs || jobsResponse.data || []);
      
      // Fetch applications for recruiter's jobs
      console.log('Fetching recruiter applications...');
      const appsResponse = await applicationService.getRecruiterApplications();
      console.log('Applications response:', appsResponse.data);
      setApplications(appsResponse.data.applications || appsResponse.data || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch recruiter data:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      // Update the local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      console.error('Failed to update application status:', err);
      setError(err.response?.data?.error || 'Failed to update application status');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const activeJobs = jobs.filter(job => job.status === 'active');
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;

  return (
    <div className="dashboard">
      {error && <div className="error-message" style={{ margin: '1rem 0' }}>{error}</div>}
      <div className="dashboard-header">
        <h1>Welcome, {user?.full_name}!</h1>
        <p>Recruiter Dashboard</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/post-job')}
          style={{ marginTop: '1rem' }}
        >
          + Post New Job
        </button>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>{jobs.length}</h3>
          <p>Total Jobs Posted</p>
        </div>
        <div className="stat-card">
          <h3>{activeJobs.length}</h3>
          <p>Active Jobs</p>
        </div>
        <div className="stat-card">
          <h3>{totalApplications}</h3>
          <p>Total Applications</p>
        </div>
        <div className="stat-card">
          <h3>{pendingApplications}</h3>
          <p>Pending Review</p>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'jobs' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('jobs')}
        >
          My Jobs
        </button>
        <button 
          className={activeTab === 'applications' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('applications')}
        >
          Applications
        </button>
      </div>

      {activeTab === 'jobs' && (
        <div className="content-section">
          <h2>My Posted Jobs</h2>
          {jobs.length === 0 ? (
            <p>You haven't posted any jobs yet.</p>
          ) : (
            <div className="jobs-grid">
              {jobs.map(job => (
                <div key={job.id} className="job-card">
                  <h3>{job.title}</h3>
                  <p className="company">{job.company}</p>
                  <p>{job.location} • {job.job_type?.replace('_', ' ')}</p>
                  <p className="status">
                    Status: <span className={`tag ${job.status}`}>{job.status}</span>
                  </p>
                  <p>Applications: {job.applications_count || 0}</p>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="content-section">
          <h2>Applications Received</h2>
          {applications.length === 0 ? (
            <p>No applications received yet.</p>
          ) : (
            <div className="applications-list">
              {applications.map(app => (
                <div key={app.id} className="application-card">
                  <div className="application-header">
                    <h3>{app.applicant_name || 'Applicant #' + app.applicant_id}</h3>
                    <span className={`tag ${app.status}`}>{app.status}</span>
                  </div>
                  <p><strong>Job:</strong> {app.job_title}</p>
                  <p><strong>Applied:</strong> {new Date(app.applied_date).toLocaleDateString()}</p>
                  {app.cover_letter && (
                    <p><strong>Cover Letter:</strong> {app.cover_letter.substring(0, 100)}...</p>
                  )}
                  <div className="action-buttons">
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleStatusUpdate(app.id, 'accepted')}
                      disabled={app.status === 'accepted' || app.status === 'rejected'}
                    >
                      Accept
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatusUpdate(app.id, 'rejected')}
                      disabled={app.status === 'accepted' || app.status === 'rejected'}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
