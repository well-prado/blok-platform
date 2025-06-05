# 🐳 Docker Development Environment - Blok Platform

## 📋 Overview

This setup provides a complete containerized development environment for the Blok Platform with all necessary services:

- **PostgreSQL 16** - User authentication and metadata
- **MongoDB 7** - Workflows and community data  
- **Redis 7** - Caching and sessions
- **pgAdmin** - PostgreSQL management UI
- **Prometheus & Grafana** - Metrics and monitoring (full setup only)

## 🚀 Quick Start Commands

### Database Services Only (Recommended for Development)
```bash
# Start databases (PostgreSQL, MongoDB, Redis + pgAdmin)
pnpm run docker:db

# Setup database with our schema
pnpm run setup:db

# Start Blok Platform locally
pnpm dev

# View database logs
pnpm run docker:db:logs

# Stop databases
pnpm run docker:db:down
```

### Full Infrastructure (All Services + Platform)
```bash
# Start everything (databases + monitoring + platform)
pnpm run docker:full

# Build and start (when code changes)
pnpm run docker:full:build

# View all logs
pnpm run docker:full:logs

# Stop everything
pnpm run docker:full:down
```

### Cleanup
```bash
# Clean up Docker system and volumes
pnpm run docker:clean
```

## 🔗 Service URLs & Access

### Application
- **Blok Platform**: http://localhost:4000
- **Metrics Endpoint**: http://localhost:4000/metrics

### Database Management
- **pgAdmin** (PostgreSQL): http://localhost:8080
  - Email: `admin@blok.dev`
  - Password: `blok123`
- **Mongo Express** (MongoDB): http://localhost:8081 *(full setup only)*
  - Username: `admin`
  - Password: `blok123`
- **Redis Commander** (Redis): http://localhost:8082 *(full setup only)*
  - Username: `admin`
  - Password: `blok123`

### Monitoring (Full Setup Only)
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
  - Username: `admin`
  - Password: `blok123`

## 📊 Database Connection Details

### PostgreSQL
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blok_platform
DB_USER=postgres
DB_PASSWORD=blok123
```

### MongoDB
```env
MONGO_URI=mongodb://admin:blok123@localhost:27017/blok_platform
```

### Redis
```env
REDIS_URL=redis://localhost:6379
```

## 🏗️ Architecture

### Database Services (`docker-compose.db.yml`)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     MongoDB     │    │      Redis      │
│   Port: 5432    │    │   Port: 27017   │    │   Port: 6379    │
│   Users & Auth  │    │ Workflows &     │    │ Cache & Sessions│
│                 │    │ Community Data  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Blok Platform  │
                    │   Port: 4000    │
                    │  (Local Dev)    │
                    └─────────────────┘
```

### Full Infrastructure (`docker-compose.full.yml`)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     MongoDB     │    │      Redis      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Blok Platform  │
                    │  (Containerized)│
                    └─────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Prometheus    │    │     Grafana     │
                    │   Port: 9090    │    │   Port: 3000    │
                    └─────────────────┘    └─────────────────┘
```

## 🛠️ Development Workflow

### 1. Initial Setup
```bash
# Clone and install dependencies
git clone <repo>
cd blok-platform
pnpm install

# Start databases
pnpm run docker:db

# Setup database schema
pnpm run setup:db

# Build and start platform
pnpm build
pnpm dev
```

### 2. Daily Development
```bash
# Start databases (if not running)
pnpm run docker:db

# Develop locally
pnpm dev

# Test authentication
pnpm run test:simple
```

### 3. Testing with Database
```bash
# Ensure databases are running
pnpm run docker:db

# Run full authentication tests
pnpm run test:auth
```

## 📝 Environment Variables

### For Local Development (with Docker databases)
Create `.env.local`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blok_platform
DB_USER=postgres
DB_PASSWORD=blok123

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/blok_platform

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=blok-platform-super-secret-key-dev-only
JWT_REFRESH_SECRET=blok-platform-refresh-secret-key-dev-only

# Server Configuration
PORT=4000
NODE_ENV=development
```

## 🧪 Testing & Verification

### Test Database Connections
```bash
# Test PostgreSQL
psql -h localhost -p 5432 -U postgres -d blok_platform

# Test MongoDB
mongosh mongodb://localhost:27017/blok_platform

# Test Redis
redis-cli -h localhost -p 6379 ping
```

### Test Authentication Endpoints
```bash
# Test workflow registration
pnpm run test:simple

# Test full authentication (requires databases)
pnpm run test:auth

# Manual test
curl -X POST http://localhost:4000/auth-register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

## 🚨 Troubleshooting

### Port Conflicts
If ports are already in use:
```bash
# Check what's using ports
lsof -i :5432  # PostgreSQL
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis

# Stop conflicting services
brew services stop postgresql
brew services stop mongodb-community
brew services stop redis
```

### Database Connection Issues
```bash
# Check container status
docker ps

# Check logs
pnpm run docker:db:logs

# Restart databases
pnpm run docker:db:down
pnpm run docker:db
```

### Clean Reset
```bash
# Stop everything and clean up
pnpm run docker:db:down
pnpm run docker:clean

# Start fresh
pnpm run docker:db
pnpm run setup:db
```

## 📈 Next Steps

With Docker environment ready:
1. ✅ **Phase 1 Complete**: Authentication system working
2. 🚀 **Phase 2**: User profiles, workflow CRUD, community features
3. 🔍 **Phase 3**: Search, AI integration, advanced features
4. 📊 **Phase 4**: Performance monitoring, scaling, production

---

**🎯 Docker Environment Status: ✅ READY FOR DEVELOPMENT** 