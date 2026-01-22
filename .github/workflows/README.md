# GitHub Actions Workflows

This directory contains CI/CD workflows for the Stock Predictor project.

## Workflows

### 🧪 test.yml - Unit Tests
**Triggers:** Push to main/develop/feature branches, PRs to main/develop

Runs comprehensive unit tests for both backend and frontend:
- **Backend**: Python tests with pytest on Python 3.11 and 3.12
- **Frontend**: TypeScript/React tests with Jest on Node 18 and 20
- **Coverage**: Uploads coverage reports to Codecov
- **Matrix**: Tests against multiple Python and Node versions

**Status Badge:**
```markdown
[![Tests](https://github.com/YOUR_USERNAME/stonk-predictor/workflows/Run%20Unit%20Tests/badge.svg)](https://github.com/YOUR_USERNAME/stonk-predictor/actions)
```

### 🐳 docker-build.yml - Docker Build
**Triggers:** Push to main, PRs to main

Validates Docker builds:
- Builds backend Docker image
- Builds frontend Docker image
- Validates docker-compose configuration
- Uses BuildKit caching for faster builds

### 🔍 lint.yml - Code Quality
**Triggers:** Push to main/develop/feature branches, PRs to main/develop

Checks code quality and style:
- **Python**: flake8, black, isort
- **TypeScript**: ESLint, TypeScript compiler checks
- Non-blocking (continues on error) to provide feedback without failing builds

## Local Testing

### Run Backend Tests
```bash
cd server
pip install -r requirements.txt
pip install -r test/requirements-test.txt
pytest test/ -v --cov=.
```

### Run Frontend Tests
```bash
cd client
npm install
npm test -- --coverage --watchAll=false
```

### Test Docker Build
```bash
docker-compose build
docker-compose up -d
docker-compose exec backend pytest test/ -v
docker-compose exec frontend npm test
```

## Workflow Status

Check the status of all workflows:
- Go to the **Actions** tab in GitHub
- View individual workflow runs
- Download artifacts and logs for debugging

## Adding New Workflows

1. Create a new `.yml` file in this directory
2. Define triggers (`on:` section)
3. Define jobs and steps
4. Test locally using [act](https://github.com/nektos/act) if possible
5. Commit and push to see it in action

## Secrets Configuration

Some workflows may require secrets to be configured in GitHub repository settings:

- `CODECOV_TOKEN` - For coverage uploads (optional)
- `DOCKER_USERNAME` - For Docker Hub publishing (if needed)
- `DOCKER_PASSWORD` - For Docker Hub publishing (if needed)

Configure at: `Settings > Secrets and variables > Actions`

## Caching

Workflows use caching to speed up runs:
- **Python**: `pip` cache managed by `setup-python` action
- **Node**: `npm` cache managed by `setup-node` action
- **Docker**: BuildKit cache layers stored in GitHub cache

## Matrix Strategy

Tests run against multiple versions to ensure compatibility:
- Python: 3.11, 3.12
- Node.js: 18, 20

This catches version-specific issues early.

## Debugging Failed Workflows

1. Click on the failed workflow run
2. Click on the failed job
3. Expand the failed step to see logs
4. Look for error messages and stack traces
5. Fix the issue locally and push again

## Best Practices

- ✅ Keep workflows fast (use caching, parallel jobs)
- ✅ Fail fast on critical issues
- ✅ Use matrix strategy for version compatibility
- ✅ Upload artifacts for debugging
- ✅ Add meaningful job and step names
- ✅ Use conditional execution (`if:`) when appropriate
- ✅ Keep secrets secure (never log them)
