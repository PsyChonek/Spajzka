# Docker Compose Quick Reference

Quick reference for running Spajzka with Docker. For full documentation, see [DOCKER.md](./DOCKER.md).

## Quick Start

```bash
# Production (recommended)
docker-compose up -d

# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Database only
docker-compose up -d mongo
```

## Available Services

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Web | 3000 | http://localhost:3000 | React PWA |
| API | 3010 | http://localhost:3010 | Express REST API |
| Swagger | 3010 | http://localhost:3010/docs | API Documentation |
| MongoDB | 27017 | localhost:27017 | Database |

## Makefile Commands

If you have `make` installed:

```bash
make help       # Show all available commands
make up         # Start production mode
make dev        # Start development mode
make down       # Stop all services
make logs       # View logs
make db-shell   # Access MongoDB shell
make clean      # Remove everything
```

## Common Commands

### View Logs
```bash
docker-compose logs -f              # All services
docker-compose logs -f api          # API only
docker-compose logs -f web          # Web only
```

### Restart Services
```bash
docker-compose restart              # All services
docker-compose restart api          # API only
```

### Stop Services
```bash
docker-compose down                 # Stop and remove containers
docker-compose down -v              # Also remove volumes
```

### Access Containers
```bash
docker-compose exec api sh          # API shell
docker-compose exec web sh          # Web shell
docker-compose exec mongo mongosh   # MongoDB shell
```

## Environment Variables

See [.env.example](./.env.example) for configuration options.

Production changes needed:
1. Copy `.env.example` to `.env`
2. Change MongoDB password
3. Generate strong JWT secret
4. Update API URL for web app

## Files Created

```
.
├── docker-compose.yml              # Production configuration
├── docker-compose.dev.yml          # Development configuration
├── .dockerignore                   # Global ignore patterns
├── .env.example                    # Environment template
├── Makefile                        # Convenience commands
├── DOCKER.md                       # Full documentation
│
├── apps/api/
│   ├── Dockerfile                  # Production API build
│   ├── Dockerfile.dev              # Development API build
│   └── .dockerignore               # API-specific ignores
│
└── apps/web/
    ├── Dockerfile                  # Production web build
    ├── Dockerfile.dev              # Development web build
    ├── nginx.conf                  # Nginx configuration
    └── .dockerignore               # Web-specific ignores
```

## Troubleshooting

**Ports already in use?**
```bash
# Windows
netstat -ano | findstr "3000 3010 27017"

# Linux/Mac
lsof -i :3000 -i :3010 -i :27017
```

**Services not starting?**
```bash
docker-compose ps                   # Check status
docker-compose logs api             # Check logs
```

**Clear everything and start fresh:**
```bash
docker-compose down -v --rmi all
docker-compose up -d --build
```

## Next Steps

1. Read the full [DOCKER.md](./DOCKER.md) documentation
2. Review [.env.example](./.env.example) for configuration
3. Check [CLAUDE.md](./CLAUDE.md) for project details

## Credentials

**Default Development Credentials** (⚠️ Change in production!):
- MongoDB User: `spajzkaadmin`
- MongoDB Password: `spajzkaadmin`
- Database: `spajzka`
- JWT Secret: `your-secret-key-change-in-production`
