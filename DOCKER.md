# Docker Setup Guide

This guide covers running Spajzka using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose V2+
- At least 2GB of available RAM
- Ports 3000, 3010, and 27017 available

## Quick Start

### Production Build

Start all services (MongoDB, API, and Web) in production mode:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- **Web App**: http://localhost:3000
- **API**: http://localhost:3010
- **Swagger Docs**: http://localhost:3010/docs
- **MongoDB**: localhost:27017

### Development Mode

For development with hot reload:

```bash
# Build and start all services in development mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

Development mode features:
- Hot reload for API and Web (source code changes reflected immediately)
- Debug port exposed for API (9229)
- Volume mounts for source code
- Development environment variables

### Database Only

To run only MongoDB (useful when running API/Web locally):

```bash
# Start only MongoDB from root docker-compose
docker-compose up -d mongo

# Or use Make
make db-only
```

## Docker Compose Files

### `docker-compose.yml` (Production)

Main production configuration:
- **mongo**: MongoDB 7 with persistent volumes
- **api**: Express API server (built from source)
- **web**: React app served via Nginx

Features:
- Health checks for all services
- Automatic restarts
- Service dependencies (web depends on api, api depends on mongo)
- Isolated network (spajzka-network)
- Persistent data volumes

### `docker-compose.dev.yml` (Development)

Development configuration with:
- Hot reload via volume mounts
- Development dependencies installed
- Debug port exposed (9229 for Node.js debugging)
- Source code mounted as read-only volumes
- Separate volumes for generated files

### Database Only Mode

To run only MongoDB without API/Web services:

```bash
docker-compose up -d mongo
```

Features:
- Same credentials as full stack configuration
- Persistent volumes for data
- Health checks
- Port 27017 exposed for local development

## Service Details

### MongoDB Service

**Image**: mongo:7
**Container**: spajzka-mongo
**Port**: 27017
**Credentials**:
- Username: `spajzkaadmin`
- Password: `spajzkaadmin`
- Database: `spajzka`

**Volumes**:
- `mongo-data`: Database files (/data/db)
- `mongo-config`: Configuration files (/data/configdb)

**Connection String**:
```
mongodb://spajzkaadmin:spajzkaadmin@localhost:27017/spajzka?authMechanism=DEFAULT
```

### API Service

**Build Context**: Root directory
**Dockerfile**: `apps/api/Dockerfile`
**Container**: spajzka-api
**Port**: 3010

**Environment Variables**:
- `PORT`: 3010
- `MONGO_URI`: Connection string to MongoDB
- `DATABASE`: spajzka
- `JWT_SECRET`: JWT signing secret (change in production!)
- `NODE_ENV`: production

**Health Check**: HTTP GET to `/api/v1/health`

**Build Process**:
1. Install dependencies
2. Generate TSOA routes and Swagger spec
3. Compile TypeScript
4. Copy built files to production image
5. Run with Node.js

### Web Service

**Build Context**: Root directory
**Dockerfile**: `apps/web/Dockerfile`
**Container**: spajzka-web
**Port**: 80 (mapped to 3000 on host)

**Build Arguments**:
- `REACT_APP_SpajzkaAPI`: API URL (default: http://localhost:3010)

**Features**:
- Built React app served via Nginx
- Gzip compression enabled
- Security headers configured
- Static asset caching
- React Router support (all routes serve index.html)

## Common Commands

### Build Services

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build api

# Build without cache
docker-compose build --no-cache
```

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d mongo

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100
```

### Execute Commands

```bash
# Access MongoDB shell
docker-compose exec mongo mongosh -u spajzkaadmin -p spajzkaadmin spajzka

# Access API container
docker-compose exec api sh

# Run npm command in API
docker-compose exec api npm run swagger
```

### Inspect Services

```bash
# List running containers
docker-compose ps

# View service health
docker-compose ps

# Inspect specific service
docker inspect spajzka-api
```

## Volume Management

### List Volumes

```bash
docker volume ls | grep spajzka
```

### Backup MongoDB Data

```bash
# Create backup
docker-compose exec mongo mongodump --username=spajzkaadmin --password=spajzkaadmin --db=spajzka --out=/tmp/backup

# Copy backup from container
docker cp spajzka-mongo:/tmp/backup ./backup
```

### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./backup spajzka-mongo:/tmp/backup

# Restore
docker-compose exec mongo mongorestore --username=spajzkaadmin --password=spajzkaadmin --db=spajzka /tmp/backup/spajzka
```

### Clear All Data

```bash
# Stop services and remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Troubleshooting

### Services Won't Start

1. Check if ports are available:
```bash
# Windows
netstat -ano | findstr "3000 3010 27017"

# Linux/Mac
lsof -i :3000 -i :3010 -i :27017
```

2. Check service logs:
```bash
docker-compose logs api
```

3. Check health status:
```bash
docker-compose ps
```

### API Can't Connect to MongoDB

1. Ensure MongoDB is healthy:
```bash
docker-compose ps mongo
```

2. Test MongoDB connection:
```bash
docker-compose exec mongo mongosh -u spajzkaadmin -p spajzkaadmin --eval "db.runCommand('ping')"
```

3. Check API logs for connection errors:
```bash
docker-compose logs api | grep -i mongo
```

### Web App Can't Reach API

1. Verify API is running:
```bash
curl http://localhost:3010/api/v1/health
```

2. Check browser console for CORS errors

3. Rebuild web with correct API URL:
```bash
docker-compose build --build-arg REACT_APP_SpajzkaAPI=http://localhost:3010 web
```

### Hot Reload Not Working (Dev Mode)

1. Ensure you're using dev compose file:
```bash
docker-compose -f docker-compose.dev.yml up
```

2. Check volume mounts:
```bash
docker-compose -f docker-compose.dev.yml exec api ls -la /app/apps/api/src
```

3. For Windows, enable polling:
```yaml
environment:
  CHOKIDAR_USEPOLLING: true
```

### Build Failures

1. Clear Docker build cache:
```bash
docker builder prune -a
```

2. Rebuild without cache:
```bash
docker-compose build --no-cache
```

3. Check disk space:
```bash
docker system df
```

## Production Considerations

### Environment Variables

Create a `.env` file for production:

```env
# API Configuration
PORT=3010
MONGO_URI=mongodb://spajzkaadmin:STRONG_PASSWORD@mongo:27017/spajzka?authMechanism=DEFAULT
DATABASE=spajzka
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
NODE_ENV=production

# Web Configuration
REACT_APP_SpajzkaAPI=https://your-domain.com/api
```

Load environment variables:
```bash
docker-compose --env-file .env up -d
```

### Security

1. **Change default passwords** in production
2. **Use secrets management** for sensitive data:
```yaml
secrets:
  mongo_password:
    external: true
```

3. **Enable TLS** for MongoDB connections
4. **Use reverse proxy** (Nginx/Traefik) for SSL termination
5. **Restrict network access** to MongoDB (don't expose port 27017)

### Scaling

Scale specific services:

```bash
# Run 3 API instances
docker-compose up -d --scale api=3
```

Note: You'll need a load balancer (e.g., Nginx, Traefik) to distribute traffic.

### Resource Limits

Add resource limits to docker-compose.yml:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Monitoring

Use Docker stats:
```bash
docker stats spajzka-mongo spajzka-api spajzka-web
```

Or integrate with monitoring tools like Prometheus/Grafana.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: docker-compose build

      - name: Run tests
        run: docker-compose run api npm test

      - name: Push to registry
        run: |
          docker tag spajzka-api registry.example.com/spajzka-api:latest
          docker push registry.example.com/spajzka-api:latest
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Project README](./README.md)
- [Claude Code Guide](./CLAUDE.md)
