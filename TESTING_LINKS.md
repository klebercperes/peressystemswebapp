# 🔗 Testing Links

## 🌐 LAN Access (Local Network Testing)

**Your Server IP: `10.0.1.122`**

Access from any device on your local network:
- **Frontend**: http://10.0.1.122:80
- **Backend**: http://10.0.1.122:8000
- **API Docs**: http://10.0.1.122:8000/docs

**Quick Test:**
```bash
curl http://10.0.1.122:80/health
curl http://10.0.1.122:8000/health
```

See `LAN_ACCESS.md` for detailed guide, troubleshooting, and mobile device access.

---

## 🌐 Application URLs (Localhost)

### Frontend (Production Build)
- **URL**: http://localhost:80
- **Status**: Production build with Nginx
- **Features**: Optimized static files, security headers, caching

### Backend API
- **Base URL**: http://localhost:8000
- **Status**: Gunicorn with 4 workers, structured logging enabled
- **Features**: JWT authentication, rate limiting, request tracking

### API Documentation (Swagger UI)
- **URL**: http://localhost:8000/docs
- **Interactive**: Yes - Test endpoints directly from browser
- **Authentication**: Click "Authorize" button to add JWT token

### Alternative API Docs (ReDoc)
- **URL**: http://localhost:8000/redoc
- **Format**: Alternative documentation view

## 🏥 Health & Status Endpoints

### Root Endpoint
- **URL**: http://localhost:8000/
- **Method**: GET
- **Response**: `{"message": "Peres Systems MSP API", "status": "running"}`

### Health Check (Enhanced)
- **URL**: http://localhost:8000/health
- **Method**: GET
- **Response**: Includes database connectivity status
- **Example**:
  ```json
  {
    "status": "healthy",
    "service": "Peres Systems MSP API",
    "database": "connected",
    "timestamp": "2025-11-14T10:37:15.028857"
  }
  ```

## 🔐 Authentication Endpoints

### Register New User
- **URL**: http://localhost:8000/api/auth/register
- **Method**: POST
- **Rate Limit**: 3 requests/hour
- **Body**:
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword123",
    "full_name": "Test User"
  }
  ```

### Login
- **URL**: http://localhost:8000/api/auth/login
- **Method**: POST
- **Rate Limit**: 5 requests/minute
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**:
  ```
  username=testuser&password=securepassword123
  ```
- **Response**: Returns JWT token
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

### Get Current User
- **URL**: http://localhost:8000/api/auth/me
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`
- **Rate Limit**: 5 requests/minute

## 📊 API Endpoints

### Clients
- **List**: http://localhost:8000/api/clients
- **Get One**: http://localhost:8000/api/clients/{client_id}
- **Create**: http://localhost:8000/api/clients (POST)
- **Update**: http://localhost:8000/api/clients/{client_id} (PUT)
- **Delete**: http://localhost:8000/api/clients/{client_id} (DELETE)
- **Rate Limit**: 100 requests/minute

### Tickets
- **List**: http://localhost:8000/api/tickets
- **Get One**: http://localhost:8000/api/tickets/{ticket_id}
- **By Client**: http://localhost:8000/api/clients/{client_id}/tickets
- **Create**: http://localhost:8000/api/tickets (POST)
- **Update**: http://localhost:8000/api/tickets/{ticket_id} (PUT)
- **Delete**: http://localhost:8000/api/tickets/{ticket_id} (DELETE)
- **Rate Limit**: 100 requests/minute

### Assets
- **List**: http://localhost:8000/api/assets
- **Get One**: http://localhost:8000/api/assets/{asset_id}
- **By Client**: http://localhost:8000/api/clients/{client_id}/assets
- **Create**: http://localhost:8000/api/assets (POST)
- **Update**: http://localhost:8000/api/assets/{asset_id} (PUT)
- **Delete**: http://localhost:8000/api/assets/{asset_id} (DELETE)
- **Rate Limit**: 100 requests/minute

## 🧪 Quick Test Commands

### Test Health Check
```bash
curl http://localhost:8000/health
```

### Test with Request ID
```bash
curl -H "X-Request-ID: test-123" http://localhost:8000/health
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_username&password=your_password"
```

### Test Authenticated Request
```bash
# First get token from login, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/clients
```

### Test Rate Limiting
```bash
# Make 6 requests quickly (5/minute limit for auth)
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test&password=wrong"
  echo ""
done
# 6th request should return 429 Too Many Requests
```

## 📝 Testing Checklist

### Basic Functionality
- [ ] Frontend loads: http://localhost:80
- [ ] Backend responds: http://localhost:8000/
- [ ] Health check works: http://localhost:8000/health
- [ ] API docs accessible: http://localhost:8000/docs

### Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] Get current user info
- [ ] Access protected endpoints with token

### API Endpoints
- [ ] Create client
- [ ] List clients
- [ ] Update client
- [ ] Delete client
- [ ] Create ticket
- [ ] Create asset

### Features
- [ ] Rate limiting works (test with multiple requests)
- [ ] Request IDs in response headers
- [ ] Structured logging in backend logs
- [ ] CORS allows frontend requests

## 🔍 Viewing Logs

### Backend Logs (Structured JSON)
```bash
docker-compose logs backend
```

### Filter by Request ID
```bash
docker-compose logs backend | grep "request_id"
```

### Filter by Log Level
```bash
docker-compose logs backend | grep '"level":"ERROR"'
```

### Follow Logs
```bash
docker-compose logs -f backend
```

## 🌍 Network Access

If accessing from a different machine on the network:

1. **Find your server IP**:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. **Update CORS_ORIGINS** in `.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://YOUR_IP:5173,http://frontend:5173
   ```

3. **Update VITE_API_URL** for frontend build:
   ```env
   VITE_API_URL=http://YOUR_IP:8000
   ```

4. **Access URLs**:
   - Frontend: http://YOUR_IP:80
   - Backend: http://YOUR_IP:8000
   - API Docs: http://YOUR_IP:8000/docs

## 🔐 Default Credentials

**Note**: No default credentials exist. You must:
1. Register the first user (becomes admin automatically)
2. Or use the admin creation script:
   ```bash
   docker-compose exec backend python3 create_admin_interactive.py
   ```

## 📊 Monitoring Endpoints

### Request ID Header
All responses include `X-Request-ID` header for tracing.

### Log Format
All logs are in JSON format with:
- `request_id`: Unique request identifier
- `method`: HTTP method
- `path`: Request path
- `status_code`: Response status
- `duration_ms`: Request duration in milliseconds

---

**Quick Start**: Open http://localhost:80 in your browser to access the application!

