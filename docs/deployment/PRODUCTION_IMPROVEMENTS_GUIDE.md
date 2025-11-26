# Production Improvements Deployment Guide

This guide covers the deployment of three production improvements: Unit Tests, Log Aggregation, and Let's Encrypt SSL.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (`peres.systems`) pointing to your server's IP
- Ports 80 and 443 available

## 1. Unit Tests

### Running Tests Locally

```bash
cd backend
pip install -r requirements.txt
pytest
```

### Running Tests in Docker

```bash
docker-compose exec backend pytest
```

### Test Coverage

The test suite includes:
- **Health Check**: Validates `/health` endpoint
- **Authentication**: Tests for registration, login, duplicate email handling, token validation
- **Database**: Uses in-memory SQLite for isolated testing

## 2. Log Aggregation (Loki Stack)

### Architecture

- **Loki**: Log storage and querying (port 3100)
- **Promtail**: Log collector from Docker containers
- **Grafana**: Visualization dashboard (port 3000)

### Deployment

The monitoring stack is included in `docker-compose.https-domain.yml`:

```bash
docker-compose -f docker-compose.https-domain.yml up -d loki promtail grafana
```

### Accessing Grafana

1. **Access via SSH Tunnel** (Recommended for security):
   ```bash
   ssh -L 3000:localhost:3000 user@your-server-ip
   ```
2. Open `http://localhost:3000` in your local browser
3. Default credentials: `admin` / `admin` (change on first login)
4. Add Loki as a data source:
   - URL: `http://loki:3100`
   - Access: Server (default)
5. Query logs using LogQL:
   ```
   {service="backend"}
   {service="frontend"}
   {container="msp_backend"}
   ```

### Custom Credentials

Set in `.env`:
```bash
GRAFANA_ADMIN_USER=your_admin_user
GRAFANA_ADMIN_PASSWORD=your_secure_password
```

## 3. Let's Encrypt SSL

### Configuration

The setup uses `nginxproxy/nginx-proxy` and `nginxproxy/acme-companion` for automatic SSL certificate management.

### Environment Variables

Add to your `.env` file:

```bash
# Domain configuration
DOMAIN=peres.systems

# Let's Encrypt email (for certificate notifications)
LETSENCRYPT_EMAIL=admin@peres.systems
```

### Deployment

```bash
docker-compose -f docker-compose.https-domain.yml up -d
```

The acme-companion will automatically:
1. Request SSL certificates from Let's Encrypt
2. Configure nginx-proxy with HTTPS
3. Renew certificates before expiration

### Verification

1. Check certificate status:
   ```bash
   docker logs msp_acme_companion
   ```

2. Visit your domain:
   ```bash
   https://peres.systems
   https://www.peres.systems
   ```

3. Verify certificate in browser (should show valid Let's Encrypt certificate)

### Troubleshooting

**Certificate not issued:**
- Ensure DNS points to your server
- Check ports 80 and 443 are accessible
- Review logs: `docker logs msp_acme_companion`

**Rate limits:**
- Let's Encrypt has rate limits (5 certificates per week per domain)
- Use staging environment for testing by adding to acme-companion:
  ```yaml
  environment:
    - ACME_CA_URI=https://acme-staging-v02.api.letsencrypt.org/directory
  ```

## Complete Deployment

To deploy all improvements:

```bash
# 1. Update .env with required variables
cp .env.example .env
nano .env  # Add DOMAIN, LETSENCRYPT_EMAIL, GRAFANA credentials

# 2. Start all services
docker-compose -f docker-compose.https-domain.yml up -d

# 3. Verify services
docker-compose -f docker-compose.https-domain.yml ps

# 4. Check logs
docker-compose -f docker-compose.https-domain.yml logs -f

# 5. Run tests
docker-compose -f docker-compose.https-domain.yml exec backend pytest
```

## Monitoring and Maintenance

### View Logs in Grafana
1. Access Grafana at `http://your-server:3000`
2. Navigate to Explore
3. Select Loki data source
4. Query: `{service="backend"} |= "error"`

### Run Tests
```bash
docker-compose exec backend pytest -v
```

### Check SSL Certificate Expiry
```bash
docker exec msp_acme_companion /app/cert_status
```

## Security Notes

- Change default Grafana password immediately
- Keep `LETSENCRYPT_EMAIL` updated for certificate notifications
- Regularly review logs for security issues
- SSL certificates auto-renew 30 days before expiration
- **Secrets Management**:
  - `.env` is for production secrets.
  - `.env.dev` is for development.
  - `.dockerignore` prevents secret leakage in builds.
  - CORS is restricted to production domains in `.env`.

## Development Mode

To run the project in development mode with hot-reloading and exposed ports:

1. **Setup Environment**:
   ```bash
   cp .env.dev .env
   # Ensure VITE_API_URL=http://localhost:8000 in .env for local dev
   ```

2. **Start Services**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```
   This exposes:
   - Postgres: 5432
   - Backend: 8000
   - Frontend: 80 (via proxy)

3. **Run Tests**:
   ```bash
   cd backend
   pytest
   ```

## Feature Implementation Workflow

Follow these steps to add a new feature (e.g., "User Avatar Upload"):

1. **Backend**:
   - Add endpoint in `app/routers/`.
   - Update `Dockerfile` if new system dependencies are needed.
   - Add environment variables to `.env.example`.

2. **Database**:
   - Create migration: `alembic revision -m "description"`
   - Apply: `alembic upgrade head`

3. **Frontend**:
   - Create component in `components/`.
   - Connect to API using `VITE_API_URL`.

4. **Testing**:
   - Write backend tests in `tests/`.
   - Verify in Docker: `docker-compose exec backend pytest`

5. **Documentation**:
   - Update this guide if deployment steps change.

## Bug Fixing & Troubleshooting

| Symptom | Fix |
|---------|-----|
| **CORS Error** | Check `CORS_ORIGINS` in `.env`. Ensure it includes your current domain/IP. |
| **DB Connection Fail** | Check `DATABASE_URL` and ensure Postgres is healthy (`docker ps`). |
| **Changes not showing** | Rebuild containers: `docker-compose up -d --build`. |
| **"Port in use"** | Stop other services or check `docker ps`. |

