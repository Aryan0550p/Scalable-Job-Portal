# System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │  Mobile App  │  │   Admin UI   │         │
│  │ (React/Vue)  │  │(React Native)│  │  Dashboard   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Load Balancer │
                    │   (AWS ALB)     │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
│                    ┌───────▼────────┐                           │
│                    │  Rate Limiter  │                           │
│                    │   & Security   │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│           ┌────────────────▼────────────────┐                   │
│           │     Node.js API Server          │                   │
│           │        (Express.js)              │                   │
│           │                                  │                   │
│           │  ┌─────────────────────────┐   │                   │
│           │  │   Controllers           │   │                   │
│           │  │   - Auth                │   │                   │
│           │  │   - Jobs                │   │                   │
│           │  │   - Applications        │   │                   │
│           │  │   - Search              │   │                   │
│           │  │   - Recommendations     │   │                   │
│           │  │   - Admin               │   │                   │
│           │  └──────────┬──────────────┘   │                   │
│           │             │                   │                   │
│           │  ┌──────────▼──────────────┐   │                   │
│           │  │   Service Layer         │   │                   │
│           │  │   - Business Logic      │   │                   │
│           │  │   - Data Validation     │   │                   │
│           │  │   - Cache Management    │   │                   │
│           │  └──────────┬──────────────┘   │                   │
│           └─────────────┼────────────────────┘                  │
└─────────────────────────┼──────────────────────────────────────┘
                          │
              ┌───────────┼────────────┐
              │           │            │
              ▼           ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ PostgreSQL  │  │   Redis     │  │Elasticsearch│            │
│  │  Database   │  │   Cache     │  │   Search    │            │
│  │             │  │             │  │   Engine    │            │
│  │  - Users    │  │  - Sessions │  │  - Job Index│            │
│  │  - Jobs     │  │  - API Cache│  │  - Full Text│            │
│  │  - Apps     │  │  - Job Cache│  │  - Filters  │            │
│  │  - Activity │  │  - User Data│  │  - Suggest  │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   ML SERVICE LAYER                               │
│                                                                  │
│           ┌──────────────────────────────┐                      │
│           │  Python ML Service (Flask)   │                      │
│           │                               │                      │
│           │  ┌────────────────────────┐  │                      │
│           │  │ Recommendation Engine  │  │                      │
│           │  │                        │  │                      │
│           │  │  - Content-Based      │  │                      │
│           │  │    (TF-IDF)           │  │                      │
│           │  │                        │  │                      │
│           │  │  - Collaborative      │  │                      │
│           │  │    Filtering          │  │                      │
│           │  │                        │  │                      │
│           │  │  - Hybrid Algorithm   │  │                      │
│           │  └────────────────────────┘  │                      │
│           │                               │                      │
│           └───────────────┬───────────────┘                      │
│                           │                                      │
│                           ▼                                      │
│                  ┌─────────────────┐                            │
│                  │  Model Storage  │                            │
│                  │  (Pickled)      │                            │
│                  └─────────────────┘                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                                 │
│                                                                  │
│           ┌──────────────┐         ┌──────────────┐            │
│           │   AWS S3     │         │  File System │            │
│           │              │         │              │            │
│           │  - Resumes   │         │  - Logs      │            │
│           │  - Documents │         │  - Temp Files│            │
│           │  - Backups   │         │              │            │
│           └──────────────┘         └──────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. User Authentication Flow
```
User → Load Balancer → API Server → JWT Middleware
                                   → Auth Controller
                                   → Auth Service
                                   → PostgreSQL (User Lookup)
                                   ← JWT Token Generated
User ← JWT Token ← API Response
```

### 2. Job Search Flow
```
User → Load Balancer → API Server → Search Controller
                                   → Check Redis Cache (Hit/Miss)
                                   → Elasticsearch Query
                                   → PostgreSQL (Full Details)
                                   → Cache Result in Redis
User ← Search Results
```

### 3. Job Recommendation Flow
```
User → API Server → Recommendation Controller
                  → Check Redis Cache
                  → ML Service (HTTP Request)
                  → Python Flask API
                  → Load User Profile (PostgreSQL)
                  → Load User Activity (PostgreSQL)
                  → Run ML Algorithms
                  → Rank & Filter Results
                  → Cache in Redis
User ← Personalized Recommendations
```

### 4. Job Application Flow
```
User → API Server → Application Controller
                  → Validation Middleware
                  → Upload Resume → AWS S3
                  → Application Service
                  → PostgreSQL (Create Application)
                  → Update Job Stats
                  → Track User Activity
                  → Create Notification
                  → Invalidate Cache
User ← Application Confirmation
Recruiter → Notification
```

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Write Path                             │
│                                                               │
│  Client Request                                               │
│       │                                                       │
│       ▼                                                       │
│  API Validation                                               │
│       │                                                       │
│       ▼                                                       │
│  Business Logic                                               │
│       │                                                       │
│       ├──────────► PostgreSQL (Write)                        │
│       │                                                       │
│       ├──────────► Elasticsearch (Index)                     │
│       │                                                       │
│       └──────────► Redis (Invalidate Cache)                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Read Path                              │
│                                                               │
│  Client Request                                               │
│       │                                                       │
│       ▼                                                       │
│  Check Redis Cache ──────────┐                              │
│       │                       │ Cache Hit                     │
│       │ Cache Miss            └─────────► Return Cached Data │
│       ▼                                                       │
│  PostgreSQL / Elasticsearch                                   │
│       │                                                       │
│       ▼                                                       │
│  Cache Result in Redis                                        │
│       │                                                       │
│       ▼                                                       │
│  Return to Client                                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │────────▶│   API       │────────▶│ PostgreSQL  │
└─────────────┘  HTTP   │  Server     │   SQL   └─────────────┘
                         └──────┬──────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
            ┌─────────────┬─────────────┬─────────────┐
            │   Redis     │Elasticsearch│ ML Service  │
            │   Cache     │   Search    │  (Python)   │
            └─────────────┴─────────────┴─────────────┘
                    │           │           │
                    └───────────┴───────────┘
                                │
                                ▼
                        ┌─────────────┐
                        │   AWS S3    │
                        │  Storage    │
                        └─────────────┘
```

## Deployment Architecture (AWS)

```
┌─────────────────────────────────────────────────────────────┐
│                          AWS Cloud                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                  │  │
│  │                                                        │  │
│  │  ┌──────────────┐         ┌──────────────┐          │  │
│  │  │  Public      │         │  Public      │          │  │
│  │  │  Subnet 1    │         │  Subnet 2    │          │  │
│  │  │              │         │              │          │  │
│  │  │  ┌────────┐  │         │  ┌────────┐  │          │  │
│  │  │  │  ALB   │  │         │  │  ALB   │  │          │  │
│  │  │  └────┬───┘  │         │  └────┬───┘  │          │  │
│  │  └───────┼──────┘         └───────┼──────┘          │  │
│  │          │                        │                  │  │
│  │          └────────────┬───────────┘                  │  │
│  │                       │                              │  │
│  │  ┌────────────────────┼──────────────────────────┐  │  │
│  │  │  Private Subnet    │                          │  │  │
│  │  │                    │                          │  │  │
│  │  │  ┌─────────────────▼─────────────────────┐   │  │  │
│  │  │  │      ECS Cluster                      │   │  │  │
│  │  │  │                                        │   │  │  │
│  │  │  │  ┌──────────┐    ┌──────────┐        │   │  │  │
│  │  │  │  │  Backend │    │    ML    │        │   │  │  │
│  │  │  │  │ Container│    │Container │        │   │  │  │
│  │  │  │  └──────────┘    └──────────┘        │   │  │  │
│  │  │  └────────────────────────────────────────┘   │  │  │
│  │  │                                                │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │  │
│  │  │  │   RDS    │  │ElastiCache│  │    ES    │   │  │  │
│  │  │  │PostgreSQL│  │   Redis   │  │  Domain  │   │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  CloudWatch  │         │     S3       │                 │
│  │  Monitoring  │         │  (Resumes)   │                 │
│  └──────────────┘         └──────────────┘                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Scalability Strategy

### Horizontal Scaling
- **API Servers**: Auto-scaling group (2-10 instances)
- **Load Balancing**: Round-robin across instances
- **Stateless Design**: No session storage on servers

### Vertical Scaling
- **Database**: RDS scalable instance types
- **Cache**: ElastiCache cluster size adjustment
- **ES**: Elasticsearch cluster scaling

### Caching Strategy
```
┌─────────────────────────────────────┐
│        Cache Hierarchy              │
│                                     │
│  L1: In-Memory (Node.js)           │
│       - Hot data                    │
│       - 1ms latency                 │
│                                     │
│  L2: Redis                          │
│       - Shared cache                │
│       - 5-10ms latency              │
│                                     │
│  L3: Database                       │
│       - Source of truth             │
│       - 50-100ms latency            │
│                                     │
└─────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────┐
│      Security Layers                │
│                                     │
│  1. Network Security                │
│     - VPC Isolation                 │
│     - Security Groups               │
│     - Network ACLs                  │
│                                     │
│  2. Application Security            │
│     - JWT Authentication            │
│     - Role-Based Access Control     │
│     - Rate Limiting                 │
│     - Input Validation              │
│                                     │
│  3. Data Security                   │
│     - Encrypted at Rest (RDS)       │
│     - Encrypted in Transit (TLS)    │
│     - Password Hashing (bcrypt)     │
│     - SQL Injection Prevention      │
│                                     │
│  4. API Security                    │
│     - CORS Policy                   │
│     - Helmet.js Headers             │
│     - HTTPS Only                    │
│                                     │
└─────────────────────────────────────┘
```

## Monitoring & Observability

```
Application Logs ──────┐
                       │
Database Metrics ──────┼──▶ Winston Logger ──▶ CloudWatch
                       │
Redis Metrics ─────────┤
                       │
API Metrics ───────────┘

Alerts ◄──── CloudWatch Alarms ◄──── Thresholds
```

---

This architecture supports:
- ✅ 10,000+ concurrent users
- ✅ 1M+ jobs indexed
- ✅ Sub-second search responses
- ✅ 99.9% uptime SLA
- ✅ Horizontal scalability
- ✅ Disaster recovery
