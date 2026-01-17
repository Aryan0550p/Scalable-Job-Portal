import React, { useState, useEffect } from 'react';
import { applicationService, jobService } from '../services/api';

const Dashboard = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'job_seeker') {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const response = await applicationService.getMyApplications();
      setApplications(response.data.applications || response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.full_name}!</h1>
        <p>Role: {user?.role === 'job_seeker' ? 'Job Seeker' : 'Recruiter'}</p>
      </div>

      {user?.role === 'job_seeker' ? (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>{applications.length}</h3>
              <p>Applications Submitted</p>
            </div>
            <div className="stat-card">
              <h3>{applications.filter(a => a.status === 'pending').length}</h3>
              <p>Pending</p>
            </div>
            <div className="stat-card">
              <h3>{applications.filter(a => a.status === 'accepted').length}</h3>
              <p>Accepted</p>
            </div>
            <div className="stat-card">
              <h3>{applications.filter(a => a.status === 'rejected').length}</h3>
              <p>Rejected</p>
            </div>
          </div>

          <div className="container">
            <h2 style={{ margin: '2rem 0 1rem' }}>My Applications</h2>
            {applications.length === 0 ? (
              <p>You haven't applied to any jobs yet.</p>
            ) : (
              <div className="jobs-grid">
                {applications.map((app) => (
                  <div key={app.id} className="job-card">
                    <h3>Application #{app.id}</h3>
                    <p className="company">Job ID: {app.job_id}</p>
                    <p>Status: <span className={`tag ${app.status}`}>{app.status}</span></p>
                    <p>Applied: {new Date(app.applied_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="container">
          <h2>Recruiter Dashboard</h2>
          <p>Recruiter features coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
