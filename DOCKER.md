# 🐳 Docker Deployment Guide

Complete guide for running the Stock Predictor application using Docker.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 4GB RAM available for containers
- 5GB free disk space

## Quick Start

### Production Build

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:5000

### Development Build (with hot-reload)

```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build
```

Development URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Container Architecture

### Backend Container
- **Base Image**: `python:3.11-slim`
- **Port**: 5000
- **Framework**: Flask + TensorFlow
- **Features**:
  - LSTM model for stock prediction
  - Data fetching from financial APIs
  - Automatic health checks
  - Volume mounts for development

### Frontend Container
- **Base Image**: `node:18-alpine` (build) + `nginx:alpine` (serve)
- **Port**: 80 (production) / 3000 (development)
- **Framework**: React + TypeScript
- **Features**:
  - Multi-stage build for optimized image size
  - Nginx reverse proxy to backend
  - Static file caching
  - Hot-reload in development mode

## Docker Commands

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Managing Containers

```bash
# Start in background
docker-compose up -d

# Start specific service
docker-compose up -d backend

# View running containers
docker-compose ps

# Stop all containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Executing Commands

```bash
# Backend shell
docker-compose exec backend /bin/bash

# Run Python commands
docker-compose exec backend python -c "import tensorflow; print(tensorflow.__version__)"

# Frontend shell
docker-compose exec frontend /bin/sh

# Run npm commands (dev only)
docker-compose exec frontend npm test
```

## Testing in Docker

### Run Backend Tests

```bash
# Install test dependencies
docker-compose exec backend pip install -r test/requirements-test.txt

# Run all tests
docker-compose exec backend pytest test/ -v

# Run with coverage
docker-compose exec backend pytest test/ --cov=. --cov-report=html

# Run specific test file
docker-compose exec backend pytest test/test_app.py -v
```

### Run Frontend Tests

```bash
# Run all tests (development mode)
docker-compose -f docker-compose.dev.yml exec frontend npm test

# Run with coverage
docker-compose -f docker-compose.dev.yml exec frontend npm test -- --coverage --watchAll=false
```

## Environment Configuration

### Backend Environment Variables

Create `server/.env` file:

```env
FLASK_ENV=production
FLASK_DEBUG=0
FMP_API_KEY=your_api_key_here
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

Update [docker-compose.yml](docker-compose.yml):

```yaml
services:
  backend:
    env_file:
      - ./server/.env
```

### Frontend Environment Variables

Create `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000
```

## Networking

Containers communicate via `stonk-network` bridge network:

- Frontend → Backend: `http://backend:5000`
- Host → Frontend: `http://localhost` (production) or `http://localhost:3000` (dev)
- Host → Backend: `http://localhost:5000`

## Volume Mounts

### Development Mode

```yaml
volumes:
  - ./server:/app          # Backend code
  - ./client:/app          # Frontend code
  - /app/node_modules      # Preserve dependencies
  - /app/__pycache__       # Ignore cache
```

### Production Mode

No volume mounts - code is copied into image at build time.

## Health Checks

Both services include health checks:

```bash
# Check container health
docker-compose ps

# Backend health endpoint
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost/
```

Health check details:
- Backend: HTTP GET to `/api/health` every 30s
- Frontend: HTTP GET to `/` every 30s
- Unhealthy after 3 consecutive failures

## Troubleshooting

### Container Won't Start

```bash
# View logs
docker-compose logs backend
docker-compose logs frontend

# Check resource usage
docker stats

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Port Already in Use

```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Host:Container
```

### Out of Memory

Increase Docker Desktop memory allocation:
1. Open Docker Desktop settings
2. Resources → Advanced
3. Increase Memory to 6GB+
4. Apply & Restart

### Permission Denied (Linux)

```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./server ./client

# Or run with sudo
sudo docker-compose up
```

### Backend Can't Install TensorFlow

```bash
# Use pre-built image (faster)
docker pull tensorflow/tensorflow:2.20.0-py3

# Update server/Dockerfile base image
FROM tensorflow/tensorflow:2.20.0-py3
```

### Frontend Build Fails

```bash
# Clear npm cache
docker-compose exec frontend npm cache clean --force

# Rebuild dependencies
docker-compose build --no-cache frontend
```

## Performance Optimization

### Image Size Reduction

Current sizes:
- Backend: ~2.5GB (TensorFlow required)
- Frontend: ~25MB (multi-stage build)

To reduce backend size:

```dockerfile
# Use slim Python
FROM python:3.11-slim

# Remove build dependencies after install
RUN apt-get purge -y gcc g++ && apt-get autoremove -y
```

### Build Speed

```bash
# Use BuildKit for parallel builds
DOCKER_BUILDKIT=1 docker-compose build

# Cache dependencies separately
# (Already implemented in Dockerfiles)
```

### Network Performance

```bash
# Use host network (Linux only)
network_mode: "host"

# Increase worker processes
# Update server/app.py or nginx.conf
```

## Production Deployment

### Security Hardening

1. **Remove debug mode**:
```yaml
environment:
  - FLASK_DEBUG=0
  - NODE_ENV=production
```

2. **Use secrets for API keys**:
```yaml
secrets:
  fmp_api_key:
    file: ./secrets/fmp_api_key.txt
```

3. **Run as non-root user**:
```dockerfile
RUN useradd -m appuser
USER appuser
```

### Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Add load balancer (nginx, HAProxy)
```

### Monitoring

```bash
# Install Prometheus + Grafana
docker-compose -f docker-compose.monitoring.yml up

# View metrics
http://localhost:9090  # Prometheus
http://localhost:3001  # Grafana
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build & Test

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: docker-compose build
      - name: Run tests
        run: |
          docker-compose up -d
          docker-compose exec backend pytest
          docker-compose exec frontend npm test
```

### Docker Hub Deployment

```bash
# Tag images
docker tag stonk-predictor-backend:latest yourusername/stonk-backend:latest
docker tag stonk-predictor-frontend:latest yourusername/stonk-frontend:latest

# Push to registry
docker push yourusername/stonk-backend:latest
docker push yourusername/stonk-frontend:latest
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Flask in Docker](https://flask.palletsprojects.com/en/latest/deploying/docker/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health: `docker-compose ps`
3. Review [TECHNICAL_README.md](TECHNICAL_README.md) for architecture details
4. Check [QUICKSTART.md](QUICKSTART.md) for basic setup
