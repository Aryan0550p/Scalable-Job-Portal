# 🚀 Next Steps After Setup

## Immediate Actions

### 1. Install Dependencies (5 minutes)
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for ML service
cd ml_service
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment (2 minutes)
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (optional for local dev)
# The defaults work fine for local Docker deployment
```

### 3. Start with Docker (Easiest - 2 minutes)
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

**Wait 30-60 seconds for all services to initialize**

### 4. Verify Installation
```bash
# Check API health
curl http://localhost:3000/health

# Expected response:
# {"status":"OK","timestamp":"...","uptime":...}
```

## Testing the Application

### Register a New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo123!@#",
    "full_name": "Demo User",
    "role": "job_seeker"
  }'
```

### Login and Get Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo123!@#"
  }'

# Copy the accessToken from response
```

### Get Jobs
```bash
curl http://localhost:3000/api/v1/jobs?page=1&limit=10
```

### Search Jobs
```bash
curl "http://localhost:3000/api/v1/search?q=developer&location=San%20Francisco"
```

### Get Personalized Recommendations
```bash
curl http://localhost:3000/api/v1/recommendations?method=hybrid \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Development Workflow

### 1. Local Development (Without Docker)

**Terminal 1 - PostgreSQL:**
```bash
# Make sure PostgreSQL is running
psql -d job_portal -f src/database/init/01_schema.sql
```

**Terminal 2 - Redis:**
```bash
redis-server
```

**Terminal 3 - Elasticsearch:**
```bash
elasticsearch
# Or: brew services start elasticsearch (Mac)
```

**Terminal 4 - ML Service:**
```bash
cd ml_service
python app.py
```

**Terminal 5 - Backend API:**
```bash
npm run dev
```

### 2. Making Changes

**After modifying code:**
```bash
# Backend changes - auto-reload with nodemon
npm run dev

# ML Service changes - restart Flask
cd ml_service
python app.py
```

**After database schema changes:**
```bash
# Run migrations
psql -d job_portal -f src/database/init/01_schema.sql
```

**After adding new jobs:**
```bash
# Reindex Elasticsearch
curl -X POST http://localhost:3000/api/v1/search/reindex \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Project Customization

### 1. Add New Features

**Example: Add a "Featured Jobs" endpoint**

1. Create service method in `src/services/jobService.js`:
```javascript
async getFeaturedJobs(limit = 10) {
  const result = await pool.query(`
    SELECT * FROM jobs 
    WHERE status = 'active' 
    AND featured = true 
    ORDER BY posted_date DESC 
    LIMIT $1
  `, [limit]);
  return result.rows;
}
```

2. Add controller method in `src/controllers/jobController.js`
3. Add route in `src/routes/jobRoutes.js`

### 2. Customize ML Recommendations

Edit `ml_service/recommendation_engine.py`:
- Adjust weights in hybrid approach (line ~300)
- Add new features to TF-IDF vectorization
- Implement A/B testing logic

### 3. Add Email Notifications

1. Install nodemailer: `npm install nodemailer`
2. Create `src/services/emailService.js`
3. Integrate with application workflow

## Deployment Guide

### Deploy to AWS

1. **Setup AWS Credentials:**
```bash
aws configure
```

2. **Initialize Terraform:**
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

3. **Push Docker Images:**
```bash
docker build -t your-registry/job-portal-backend .
docker push your-registry/job-portal-backend

cd ml_service
docker build -t your-registry/job-portal-ml .
docker push your-registry/job-portal-ml
```

4. **Deploy via GitHub Actions:**
```bash
git push origin main
# CI/CD pipeline automatically deploys
```

### Deploy to Heroku (Alternative)

```bash
heroku create job-portal-api
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main
```

## Monitoring & Maintenance

### Check Logs
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f ml_service

# Application logs
tail -f logs/combined.log
tail -f logs/error.log
```

### Database Backup
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres job_portal > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres job_portal < backup.sql
```

### Performance Monitoring
```bash
# Redis stats
docker-compose exec redis redis-cli INFO stats

# Elasticsearch health
curl http://localhost:9200/_cluster/health

# Database connections
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

## Common Tasks

### Add Sample Data
```bash
psql -d job_portal -f src/database/init/02_seed.sql
```

### Clear Cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

### Reindex Elasticsearch
```bash
curl -X POST http://localhost:3000/api/v1/search/reindex \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Train ML Models
```bash
curl -X POST http://localhost:5000/api/recommend/train
```

## Troubleshooting

### Issue: Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or change PORT in .env
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Issue: Elasticsearch Not Starting
```bash
# Increase Docker memory to 4GB+
# In Docker Desktop: Settings > Resources > Memory

# Or use smaller ES heap
export ES_JAVA_OPTS="-Xms512m -Xmx512m"
```

### Issue: ML Service Error
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
cd ml_service
pip install -r requirements.txt --force-reinstall
```

## Resources

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Quick Start**: See `QUICKSTART.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`
- **Main README**: See `README.md`

## Get Help

1. Check the documentation files
2. Review logs for error messages
3. Ensure all services are running
4. Verify environment variables are set
5. Check Docker container status

## Success Checklist

- [ ] All services started successfully
- [ ] Health check returns 200 OK
- [ ] Can register and login users
- [ ] Can create and retrieve jobs
- [ ] Search returns results
- [ ] Recommendations endpoint works
- [ ] Admin dashboard accessible

## 🎉 You're All Set!

Your production-grade job portal is ready. Start customizing and building amazing features!

**Happy Coding! 🚀**
