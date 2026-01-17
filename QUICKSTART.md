# Quick Start Guide

## Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development without Docker)

## Quick Start with Docker (Recommended)

1. **Clone and setup environment**
```bash
git clone <repository-url>
cd Scalable-Job-Portal-with-Recommendation-Engine
cp .env.example .env
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Wait for services to be ready** (30-60 seconds)
```bash
docker-compose logs -f
```

4. **Access the application**
- API: http://localhost:3000
- Health Check: http://localhost:3000/health

## Local Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Setup PostgreSQL database**
```bash
# Create database
createdb job_portal

# Run migrations
psql -d job_portal -f src/database/init/01_schema.sql
psql -d job_portal -f src/database/init/02_seed.sql
```

3. **Start Redis and Elasticsearch**
```bash
# Redis
redis-server

# Elasticsearch
elasticsearch
```

4. **Setup ML Service**
```bash
cd ml_service
pip install -r requirements.txt
python app.py
```

5. **Start backend**
```bash
npm run dev
```

## Testing the API

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "full_name": "Test User",
    "role": "job_seeker"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Get Jobs
```bash
curl http://localhost:3000/api/v1/jobs?page=1&limit=10
```

### 4. Search Jobs
```bash
curl "http://localhost:3000/api/v1/search?q=developer&location=remote"
```

### 5. Get Recommendations (requires authentication)
```bash
curl http://localhost:3000/api/v1/recommendations?method=hybrid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Default Credentials

Sample users are seeded in the database:

**Job Seeker:**
- Email: seeker1@email.com
- Password: password123

**Recruiter:**
- Email: recruiter1@techcorp.com
- Password: password123

**Admin:**
- Email: admin@jobportal.com
- Password: admin123

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or change PORT in .env
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres
```

### Elasticsearch not responding
```bash
# Wait for ES to start (can take 30-60 seconds)
curl http://localhost:9200/_cluster/health
```

## Next Steps

1. Explore the API documentation in README.md
2. Check out the ML recommendation engine
3. Try the admin analytics dashboard
4. Customize the configuration in .env

## Support

For issues, please check the README.md or open an issue on GitHub.
