# Rate Limiting Implementation

## ✅ What Was Implemented

Rate limiting has been added to protect the API from abuse using the `slowapi` library.

### Rate Limits Configured

1. **General API Endpoints**: `100/minute`
   - All CRUD operations (clients, tickets, assets)
   - Applied to all `/api/*` endpoints

2. **Authentication Endpoints**: `5/minute`
   - `/api/auth/login`
   - `/api/auth/me`
   - Stricter to prevent brute force attacks

3. **Registration Endpoint**: `3/hour`
   - `/api/auth/register`
   - Very strict to prevent spam account creation

### Endpoints Protected

**All 17 API endpoints** now have rate limiting:
- ✅ All client endpoints (5 endpoints)
- ✅ All ticket endpoints (6 endpoints)
- ✅ All asset endpoints (6 endpoints)
- ✅ Auth endpoints (3 endpoints)

**Excluded from rate limiting:**
- `/` - Health check (for monitoring)
- `/health` - Enhanced health check (for monitoring)

## 🔧 Configuration

Rate limits are configurable via environment variables in `.env`:

```env
# General API rate limit
API_RATE_LIMIT=100/minute

# Authentication endpoints (stricter)
AUTH_RATE_LIMIT=5/minute

# Registration endpoint (very strict)
REGISTER_RATE_LIMIT=3/hour
```

### Rate Limit Format

The format is: `number/period`

Examples:
- `100/minute` - 100 requests per minute
- `5/second` - 5 requests per second
- `3/hour` - 3 requests per hour
- `1000/day` - 1000 requests per day

## 🛡️ How It Works

1. **IP-based tracking**: Rate limits are tracked by client IP address
2. **Per-endpoint limits**: Each endpoint can have different limits
3. **Automatic blocking**: When limit is exceeded, returns `429 Too Many Requests`
4. **Error response**: Returns JSON with error message

### Example Rate Limit Response

```json
{
  "detail": "Rate limit exceeded: 5 per 1 minute"
}
```

HTTP Status: `429 Too Many Requests`

## 🧪 Testing Rate Limiting

### Test Login Rate Limit (5/minute)

```bash
# Make 6 requests quickly - 6th should be rate limited
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test&password=wrong"
  echo ""
done
```

### Test Registration Rate Limit (3/hour)

```bash
# Make 4 registration attempts - 4th should be rate limited
for i in {1..4}; do
  curl -X POST http://localhost:8000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"test'$i'","email":"test'$i'@test.com","password":"test123"}'
  echo ""
done
```

### Test General API Rate Limit (100/minute)

```bash
# Make 101 requests - 101st should be rate limited
for i in {1..101}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://localhost:8000/api/clients
  echo "Request $i"
done
```

## 📊 Production Considerations

### Current Implementation
- ✅ In-memory rate limiting (works for single server)
- ✅ IP-based tracking
- ✅ Configurable limits

### For Production (Multiple Servers)
If you have multiple backend servers, consider:

1. **Redis-based rate limiting**:
   ```python
   from slowapi import Limiter
   from slowapi.util import get_remote_address
   from slowapi.middleware import SlowAPIMiddleware
   import redis
   
   redis_client = redis.Redis(host='redis', port=6379)
   limiter = Limiter(
       key_func=get_remote_address,
       storage_uri="redis://redis:6379"
   )
   ```

2. **User-based rate limiting** (instead of IP):
   - Track by user ID for authenticated users
   - More accurate for legitimate users behind NAT/proxy

3. **Whitelist trusted IPs**:
   - Allow higher limits for internal services
   - Bypass rate limiting for monitoring systems

## 🔍 Monitoring

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

## ⚙️ Adjusting Limits

To adjust rate limits, update your `.env` file:

```env
# More permissive
API_RATE_LIMIT=200/minute
AUTH_RATE_LIMIT=10/minute

# More restrictive
API_RATE_LIMIT=50/minute
AUTH_RATE_LIMIT=3/minute
REGISTER_RATE_LIMIT=1/hour
```

Then restart the backend:
```bash
docker-compose restart backend
```

## 🚨 Security Benefits

1. **Prevents brute force attacks** on login endpoints
2. **Prevents spam registration** attempts
3. **Protects against DDoS** (distributed denial of service)
4. **Prevents API abuse** from single IP
5. **Reduces database load** from excessive requests

## 📝 Notes

- Rate limits reset automatically after the time period
- Limits are per IP address
- Health check endpoints are not rate limited (for monitoring)
- Rate limiting works with authentication (applied after auth check)

---

**Status**: ✅ Rate limiting fully implemented and protecting all API endpoints!

