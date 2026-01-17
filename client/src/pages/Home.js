import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <div className="hero">
        <h1>Find Your Dream Job Today</h1>
        <p>Thousands of jobs waiting for you. Start your career journey now!</p>
        <Link to="/jobs" className="btn btn-secondary">
          Browse Jobs
        </Link>
      </div>

      <div className="container">
        <h2 style={{ textAlign: 'center', margin: '3rem 0 2rem' }}>Why Choose Us?</h2>
        <div className="jobs-grid">
          <div className="job-card">
            <h3>🎯 Personalized Matches</h3>
            <p>Get job recommendations tailored to your skills and preferences</p>
          </div>
          <div className="job-card">
            <h3>🚀 Fast Applications</h3>
            <p>Apply to multiple jobs with just one click</p>
          </div>
          <div className="job-card">
            <h3>💼 Top Companies</h3>
            <p>Connect with leading companies across industries</p>
          </div>
          <div className="job-card">
            <h3>📊 Track Progress</h3>
            <p>Monitor your applications and stay updated</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '4rem 0' }}>
          <h2>Ready to Start?</h2>
          <p style={{ margin: '1rem 0' }}>Create your account and find your perfect job match</p>
          <Link to="/register" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Sign Up Now
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ color: '#667eea', borderColor: '#667eea' }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
