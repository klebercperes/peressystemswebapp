# Sentry Error Tracking Setup

## ✅ What Was Implemented

Sentry error tracking has been integrated into the backend for production error monitoring.

### Features

1. **Automatic Error Capture**
   - All unhandled exceptions
   - FastAPI errors
   - SQLAlchemy errors
   - Logging errors

2. **Performance Monitoring**
   - Transaction tracing
   - Performance profiling
   - Request duration tracking

3. **Context Information**
   - Request details
   - User information (if available)
   - Environment information
   - Release version tracking

## 🔧 Configuration

### 1. Create Sentry Account

1. Go to https://sentry.io/
2. Sign up for a free account
3. Create a new project (select "FastAPI")
4. Copy the DSN (Data Source Name)

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Sentry DSN (get from sentry.io project settings)
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id

# Environment name
ENVIRONMENT=production

# Release version (optional, for tracking deployments)
RELEASE_VERSION=v1.0.0

# Performance monitoring sample rates (0.0 to 1.0)
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% of profiles
```

### 3. Restart Backend

```bash
docker-compose restart backend
```

## 📊 What Gets Tracked

### Automatic Tracking

- ✅ Unhandled exceptions
- ✅ HTTP errors (4xx, 5xx)
- ✅ Database errors
- ✅ Authentication failures
- ✅ Rate limit exceeded errors

### Performance Data

- Request duration
- Database query times
- Slow endpoints
- Transaction traces

### Context Data

- Request ID
- User ID (if authenticated)
- IP address
- User agent
- Environment
- Release version

## 🧪 Testing

### Test Error Tracking

1. **Trigger an error**:
   ```bash
   curl http://localhost:8000/api/invalid-endpoint
   ```

2. **Check Sentry dashboard**:
   - Go to https://sentry.io/
   - Navigate to your project
   - Check "Issues" tab
   - You should see the error

### Test Manual Error Reporting

```python
import sentry_sdk

# Capture exception
try:
    # code that might fail
    pass
except Exception as e:
    sentry_sdk.capture_exception(e)

# Capture message
sentry_sdk.capture_message("Something went wrong", level="warning")
```

## 🔍 Viewing Errors

### Sentry Dashboard

1. **Issues Tab**: List of all errors
2. **Performance Tab**: Performance metrics
3. **Releases Tab**: Errors by release version
4. **Alerts**: Configure email/Slack notifications

### Error Details

Each error includes:
- Stack trace
- Request context
- User information
- Environment
- Release version
- Breadcrumbs (events leading to error)

## ⚙️ Configuration Options

### Sample Rates

Control how much data is sent:

```env
# Low traffic: 1.0 (100%)
SENTRY_TRACES_SAMPLE_RATE=1.0

# High traffic: 0.1 (10%)
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Filtering

Errors can be filtered in `backend/app/sentry_config.py`:

```python
# Ignore specific errors
ignore_errors=[
    "KeyboardInterrupt",
    "RateLimitExceeded",  # Add custom filters
]
```

## 🔔 Setting Up Alerts

1. Go to Sentry project settings
2. Navigate to "Alerts"
3. Create alert rule:
   - **Trigger**: When an issue is seen more than X times
   - **Action**: Send email/Slack notification
   - **Conditions**: Filter by environment, release, etc.

## 📝 Best Practices

1. **Don't send PII**
   - Sentry is configured with `send_default_pii=False`
   - Don't log passwords, tokens, or sensitive data

2. **Use appropriate sample rates**
   - High traffic: Lower sample rates (0.1)
   - Low traffic: Higher sample rates (1.0)

3. **Tag errors**
   ```python
   sentry_sdk.set_tag("user_id", user.id)
   sentry_sdk.set_tag("endpoint", "/api/clients")
   ```

4. **Add context**
   ```python
   sentry_sdk.set_context("request", {
       "method": "POST",
       "path": "/api/clients",
       "user_id": user.id
   })
   ```

## 🚫 Disabling Sentry

If you need to disable Sentry:

1. **Remove SENTRY_DSN** from `.env`:
   ```env
   # SENTRY_DSN=
   ```

2. **Or set to empty**:
   ```env
   SENTRY_DSN=
   ```

The application will continue to work normally, just without error tracking.

## 🔄 Release Tracking

Track errors by deployment version:

```env
RELEASE_VERSION=v1.2.3
```

In Sentry:
- View errors by release
- Compare releases
- Track regression

## 📊 Integration with Logging

Sentry integrates with structured logging:
- Log errors are automatically sent to Sentry
- Log levels map to Sentry severity
- Request context is included

## 🧪 Testing in Development

For development, you can:
1. Use a separate Sentry project
2. Set `ENVIRONMENT=development`
3. Use higher sample rates for testing

---

**Status**: ✅ Sentry error tracking configured and ready (set SENTRY_DSN to enable)

