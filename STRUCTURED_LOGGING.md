# Structured Logging Implementation

## ✅ What Was Implemented

Structured JSON logging has been implemented for production-ready logging and monitoring.

### Features

1. **JSON Logging Format**
   - All logs output in JSON format
   - Easy to parse and analyze
   - Compatible with log aggregation tools (ELK, CloudWatch, etc.)

2. **Request ID Tracking**
   - Every request gets a unique request ID
   - Request ID included in all log entries
   - Request ID returned in response headers (`X-Request-ID`)
   - Enables request tracing across services

3. **Automatic Request Logging**
   - All requests automatically logged with:
     - Method, path, query parameters
     - Client IP, user agent
     - Response status code
     - Request duration
   - Errors automatically logged with stack traces

4. **Configurable Log Levels**
   - Set via `LOG_LEVEL` environment variable
   - Default: `INFO`
   - Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`

5. **Structured Logging Helper**
   - Easy-to-use logger with `extra` context
   - Consistent format across application

## 📁 Files Created

- `backend/app/logging_config.py` - Logging configuration
- `backend/app/middleware.py` - Request ID and logging middleware

## 🔧 Configuration

### Environment Variables

```env
# Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=info
```

### Log Format

All logs are in JSON format:
```json
{
  "timestamp": "2025-11-14 10:30:00",
  "level": "INFO",
  "name": "app.main",
  "message": "Request started",
  "pathname": "/app/app/main.py",
  "lineno": 45,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/clients",
  "client_ip": "172.18.0.1",
  "user_agent": "Mozilla/5.0..."
}
```

## 🚀 Usage

### Basic Logging

```python
from app.logging_config import get_logger

logger = get_logger(__name__)

# Simple log
logger.info("User action completed")

# With context
logger.info(
    "User created",
    extra={
        "user_id": user.id,
        "username": user.username,
        "action": "create"
    }
)
```

### Request Context

Request ID is automatically available in request state:

```python
from fastapi import Request

def my_endpoint(request: Request):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info("Processing request", extra={"request_id": request_id})
```

### Log Levels

```python
logger.debug("Detailed debugging information")
logger.info("General informational message")
logger.warning("Warning message")
logger.error("Error occurred", exc_info=True)  # Include stack trace
logger.critical("Critical error")
```

## 📊 Log Examples

### Request Log

```json
{
  "timestamp": "2025-11-14 10:30:00",
  "level": "INFO",
  "message": "Request started",
  "request_id": "abc123",
  "method": "GET",
  "path": "/api/clients",
  "client_ip": "172.18.0.1"
}
```

### Response Log

```json
{
  "timestamp": "2025-11-14 10:30:00",
  "level": "INFO",
  "message": "Request completed",
  "request_id": "abc123",
  "method": "GET",
  "path": "/api/clients",
  "status_code": 200,
  "duration_ms": 45.23
}
```

### Error Log

```json
{
  "timestamp": "2025-11-14 10:30:00",
  "level": "ERROR",
  "message": "Request failed",
  "request_id": "abc123",
  "method": "POST",
  "path": "/api/clients",
  "error": "Database connection failed",
  "error_type": "OperationalError",
  "duration_ms": 1200.45
}
```

## 🔍 Request ID

Every request gets a unique request ID:

1. **Generated automatically** if not provided
2. **Can be provided** via `X-Request-ID` header
3. **Returned in response** as `X-Request-ID` header
4. **Included in all logs** for that request

### Using Request ID

```bash
# Make request with custom request ID
curl -H "X-Request-ID: my-custom-id" http://localhost:8000/api/clients

# Response includes request ID
X-Request-ID: my-custom-id
```

## 📈 Benefits

1. **Production Debugging**
   - Trace requests through the system
   - Find all logs for a specific request
   - Debug issues faster

2. **Log Aggregation**
   - JSON format works with ELK, CloudWatch, Datadog
   - Easy to parse and search
   - Better than plain text logs

3. **Performance Monitoring**
   - Request duration automatically logged
   - Identify slow endpoints
   - Track performance trends

4. **Error Tracking**
   - Errors automatically logged with context
   - Stack traces included
   - Request context preserved

## 🔧 Integration with Log Aggregation

### ELK Stack (Elasticsearch, Logstash, Kibana)

Logs are JSON, ready for Elasticsearch indexing.

### CloudWatch

```python
# AWS CloudWatch Logs automatically parses JSON
# No additional configuration needed
```

### Datadog

```python
# Datadog automatically extracts JSON fields
# Can create dashboards from structured fields
```

## 🧪 Testing

### View Logs

```bash
# View all logs
docker-compose logs backend

# Follow logs
docker-compose logs -f backend

# Filter by level
docker-compose logs backend | grep '"level":"ERROR"'

# Filter by request ID
docker-compose logs backend | grep "abc123"
```

### Test Request ID

```bash
# Make request
curl -H "X-Request-ID: test-123" http://localhost:8000/api/clients

# Check logs for request ID
docker-compose logs backend | grep "test-123"
```

## 📝 Best Practices

1. **Always include context** in log messages
   ```python
   logger.info("User action", extra={"user_id": user.id, "action": "update"})
   ```

2. **Use appropriate log levels**
   - DEBUG: Detailed debugging
   - INFO: Normal operations
   - WARNING: Something unexpected but handled
   - ERROR: Error that needs attention
   - CRITICAL: System failure

3. **Include request ID** in custom logs
   ```python
   request_id = getattr(request.state, "request_id", "unknown")
   logger.info("Processing", extra={"request_id": request_id})
   ```

4. **Log errors with stack traces**
   ```python
   try:
       # code
   except Exception as e:
       logger.error("Operation failed", exc_info=True)
   ```

## 🔄 Migration from Print/Logging

### Before
```python
print(f"User {username} logged in")
logging.info(f"Processing request to {path}")
```

### After
```python
logger.info("User logged in", extra={"username": username})
logger.info("Processing request", extra={"path": path, "request_id": request_id})
```

## 📊 Monitoring Queries

### Find slow requests
```bash
docker-compose logs backend | jq 'select(.duration_ms > 1000)'
```

### Find errors
```bash
docker-compose logs backend | jq 'select(.level == "ERROR")'
```

### Find requests by user
```bash
docker-compose logs backend | jq 'select(.username == "admin")'
```

## 🚨 Production Considerations

1. **Log Rotation**
   - Configure log rotation in Docker/Kubernetes
   - Use log aggregation service
   - Don't store logs indefinitely

2. **Sensitive Data**
   - Don't log passwords, tokens, PII
   - Use log sanitization if needed
   - Review logs before sharing

3. **Performance**
   - Logging adds minimal overhead
   - JSON serialization is fast
   - Request ID generation is O(1)

---

**Status**: ✅ Structured logging fully implemented and ready for production!

