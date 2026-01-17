-- Insert admin user
INSERT INTO users (email, password, full_name, role, is_active, is_verified)
VALUES ('admin@jobportal.com', '$2a$10$XxXxXxXxXxXxXxXxXxXxXe', 'Admin User', 'admin', true, true);

-- Insert sample recruiters
INSERT INTO users (email, password, full_name, role, company_name, is_active, is_verified)
VALUES 
('recruiter1@techcorp.com', '$2a$10$XxXxXxXxXxXxXxXxXxXxXe', 'John Recruiter', 'recruiter', 'TechCorp Inc', true, true),
('recruiter2@innovate.com', '$2a$10$XxXxXxXxXxXxXxXxXxXxXe', 'Sarah HR', 'recruiter', 'Innovate Solutions', true, true);

-- Insert sample job seekers
INSERT INTO users (email, password, full_name, role, is_active, is_verified)
VALUES 
('seeker1@email.com', '$2a$10$XxXxXxXxXxXxXxXxXxXxXe', 'Alice Developer', 'job_seeker', true, true),
('seeker2@email.com', '$2a$10$XxXxXxXxXxXxXxXxXxXxXe', 'Bob Engineer', 'job_seeker', true, true);

-- Insert job seeker profiles
INSERT INTO job_seeker_profiles (user_id, skills, experience_years, education_level, current_job_title)
VALUES 
(4, ARRAY['JavaScript', 'React', 'Node.js', 'MongoDB'], 3, 'Bachelor', 'Full Stack Developer'),
(5, ARRAY['Python', 'Django', 'PostgreSQL', 'Docker'], 5, 'Master', 'Senior Backend Engineer');

-- Insert sample jobs
INSERT INTO jobs (recruiter_id, title, description, company, location, salary_min, salary_max, job_type, experience_level, skills, status)
VALUES 
(2, 'Senior Full Stack Developer', 'We are looking for an experienced full stack developer...', 'TechCorp Inc', 'San Francisco, CA', 120000, 180000, 'full_time', 'senior', ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'], 'active'),
(2, 'DevOps Engineer', 'Join our DevOps team to build scalable infrastructure...', 'TechCorp Inc', 'Remote', 100000, 150000, 'full_time', 'mid', ARRAY['Docker', 'Kubernetes', 'AWS', 'Terraform'], 'active'),
(3, 'Machine Learning Engineer', 'Work on cutting-edge ML projects...', 'Innovate Solutions', 'New York, NY', 130000, 200000, 'full_time', 'senior', ARRAY['Python', 'TensorFlow', 'PyTorch', 'ML'], 'active');
