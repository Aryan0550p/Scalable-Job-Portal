# API Reference

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required, min 8 chars)",
  "full_name": "string (required)",
  "role": "job_seeker | recruiter (required)",
  "phone": "string (optional)",
  "company_name": "string (required if role=recruiter)"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "job_seeker"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

---

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** `200 OK`

---

### Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

---

### Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

---

### Get Profile
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

---

## Job Endpoints

### Get All Jobs
**GET** `/jobs`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `location` (string, optional)
- `job_type` (string, optional): full_time, part_time, contract, internship, freelance
- `experience_level` (string, optional): entry, mid, senior, lead, executive
- `salary_min` (number, optional)
- `remote_allowed` (boolean, optional)
- `skills` (array, optional)

**Response:** `200 OK`
```json
{
  "jobs": [
    {
      "id": 1,
      "title": "Senior Full Stack Developer",
      "description": "...",
      "company": "TechCorp",
      "location": "San Francisco, CA",
      "salary_min": 120000,
      "salary_max": 180000,
      "job_type": "full_time",
      "experience_level": "senior",
      "skills": ["JavaScript", "React", "Node.js"],
      "posted_date": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

---

### Get Job by ID
**GET** `/jobs/:id`

**Response:** `200 OK`

---

### Create Job (Recruiter only)
**POST** `/jobs`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "company": "string (required)",
  "location": "string (required)",
  "salary_min": "number (optional)",
  "salary_max": "number (optional)",
  "job_type": "full_time | part_time | contract | internship | freelance",
  "experience_level": "entry | mid | senior | lead | executive",
  "skills": ["string array (required)"],
  "requirements": ["string array (optional)"],
  "benefits": ["string array (optional)"],
  "remote_allowed": "boolean (default: false)",
  "closing_date": "date (optional)"
}
```

---

### Update Job (Recruiter only)
**PUT** `/jobs/:id`

---

### Delete Job (Recruiter only)
**DELETE** `/jobs/:id`

---

### Get My Jobs (Recruiter only)
**GET** `/jobs/my/jobs`

---

### Save Job (Job Seeker only)
**POST** `/jobs/:id/save`

---

### Unsave Job (Job Seeker only)
**DELETE** `/jobs/:id/save`

---

### Get Saved Jobs (Job Seeker only)
**GET** `/jobs/saved/list`

---

## Application Endpoints

### Create Application (Job Seeker only)
**POST** `/applications`

**Request Body:**
```json
{
  "job_id": "number (required)",
  "resume_url": "string (optional)",
  "cover_letter": "string (optional)"
}
```

---

### Get My Applications (Job Seeker only)
**GET** `/applications/my/applications`

---

### Get Application by ID
**GET** `/applications/:id`

---

### Get Job Applications (Recruiter only)
**GET** `/applications/job/:jobId`

---

### Update Application Status (Recruiter only)
**PATCH** `/applications/:id/status`

**Request Body:**
```json
{
  "status": "pending | reviewed | shortlisted | rejected | accepted"
}
```

---

### Withdraw Application (Job Seeker only)
**DELETE** `/applications/:id`

---

## Search Endpoints

### Search Jobs
**GET** `/search`

**Query Parameters:**
- `q` (string): search query
- `page` (number)
- `limit` (number)
- `location` (string)
- `job_type` (string)
- `experience_level` (string)
- `salary_min` (number)
- `skills` (array)

**Response:** `200 OK`
```json
{
  "jobs": [...],
  "total": 25,
  "page": 1,
  "totalPages": 2,
  "highlights": {
    "1": {
      "title": ["<em>Developer</em>"],
      "description": ["Python <em>developer</em> with..."]
    }
  }
}
```

---

### Get Search Suggestions
**GET** `/search/suggest?q=dev`

---

### Reindex Jobs (Admin only)
**POST** `/search/reindex`

---

## Recommendation Endpoints

### Get Recommendations (Job Seeker only)
**GET** `/recommendations`

**Query Parameters:**
- `method` (string, default: hybrid): content-based, collaborative, hybrid
- `limit` (number, default: 10)

**Response:** `200 OK`
```json
{
  "recommendations": [
    {
      "job_id": 1,
      "title": "Full Stack Developer",
      "location": "San Francisco",
      "job_type": "full_time",
      "score": 0.85
    }
  ],
  "method": "hybrid",
  "user_id": 1
}
```

---

### Train ML Models (Admin only)
**POST** `/recommendations/train`

---

## Admin Analytics Endpoints

### Get Dashboard Data (Admin only)
**GET** `/admin/dashboard`

**Response:** `200 OK`
```json
{
  "overview": {
    "total_job_seekers": 1000,
    "total_recruiters": 50,
    "active_jobs": 200,
    "total_applications": 5000
  },
  "topJobs": [...],
  "topRecruiters": [...],
  "skillsInDemand": [...],
  "locationStats": [...]
}
```

---

### Get Overview Stats (Admin only)
**GET** `/admin/stats/overview`

---

### Get Job Stats (Admin only)
**GET** `/admin/stats/jobs?startDate=2026-01-01&endDate=2026-01-31`

---

### Get Application Stats (Admin only)
**GET** `/admin/stats/applications`

---

### Get User Growth (Admin only)
**GET** `/admin/stats/user-growth?days=30`

---

### Get Top Jobs (Admin only)
**GET** `/admin/stats/top-jobs?limit=10`

---

### Get Top Recruiters (Admin only)
**GET** `/admin/stats/top-recruiters?limit=10`

---

### Get Skills in Demand (Admin only)
**GET** `/admin/stats/skills?limit=20`

---

### Get Location Stats (Admin only)
**GET** `/admin/stats/locations`

---

### Get Conversion Rates (Admin only)
**GET** `/admin/stats/conversion`

---

### Get Recruiter Performance (Admin & Recruiter)
**GET** `/admin/performance?recruiterId=1`

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**
```json
{
  "errors": ["Validation error messages"]
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "message": "Error message"
  }
}
```

---

## Rate Limiting

API requests are rate-limited to 100 requests per 15 minutes per IP address.

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```
