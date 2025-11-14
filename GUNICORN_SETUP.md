# Gunicorn Production Setup

## ✅ What Was Implemented

Gunicorn has been configured as the production WSGI server with Uvicorn workers for better performance and scalability.

### Configuration

1. **Gunicorn Configuration File** (`backend/gunicorn_config.py`)
   - Worker processes: 4 (configurable via `GUNICORN_WORKERS` env var)
   - Worker class: `uvicorn.workers.UvicornWorker` (async support)
   - Timeout: 120 seconds (for long-running requests)
   - Keepalive: 5 seconds
   - Max requests: 1000 per worker (prevents memory leaks)
   - Preload app: Enabled (faster startup)
   - Graceful shutdown: 30 seconds

2. **Dockerfile Updated**
   - Changed from: `uvicorn app.main:app --reload`
   - Changed to: `gunicorn app.main:app -c gunicorn_config.py`

3. **Environment Variables**
   - `GUNICORN_WORKERS`: Number of worker processes (default: 4)
   - `LOG_LEVEL`: Logging level (default: info)

## 🚀 Performance Benefits

### Before (Single Uvicorn Process)
- ❌ Single process handling all requests
- ❌ No process isolation
- ❌ One request blocks others
- ❌ Limited scalability

### After (Gunicorn with 4 Workers)
- ✅ **4 worker processes** handling requests in parallel
- ✅ **Better concurrency** - Multiple requests processed simultaneously
- ✅ **Process isolation** - One worker crash doesn't affect others
- ✅ **Auto-restart** - Workers restart after 1000 requests (prevents memory leaks)
- ✅ **Graceful shutdown** - Workers finish current requests before stopping

## 📊 Worker Configuration

### Formula
The default worker count uses: `(2 × CPU cores) + 1`

For Docker containers, this defaults to **4 workers** but can be customized.

### Adjusting Workers

Update `.env` file:
```env
# For high-traffic scenarios
GUNICORN_WORKERS=8

# For low-resource environments
GUNICORN_WORKERS=2
```

Then restart:
```bash
docker-compose restart backend
```

### Recommended Worker Counts

- **Development**: 2 workers
- **Small production**: 4 workers (default)
- **Medium production**: 6-8 workers
- **High traffic**: 8-16 workers (adjust based on CPU cores)

**Note**: Too many workers can actually hurt performance due to context switching overhead.

## 🔍 Monitoring Workers

### Check Worker Status

```bash
# View gunicorn logs
docker-compose logs backend | grep -E "(worker|Booting)"

# Check process count
docker-compose exec backend sh -c "ps aux | grep gunicorn"
```

### Expected Log Output

```
[INFO] Starting gunicorn 23.0.0
[INFO] Listening at: http://0.0.0.0:8000 (1)
[INFO] Using worker: uvicorn.workers.UvicornWorker
[INFO] Booting worker with pid: 9
[INFO] Booting worker with pid: 10
[INFO] Booting worker with pid: 11
[INFO] Booting worker with pid: 12
```

## ⚙️ Configuration Details

### Key Settings in `gunicorn_config.py`

```python
# Worker processes
workers = 4  # Configurable via GUNICORN_WORKERS env var

# Worker class (Uvicorn for async FastAPI)
worker_class = "uvicorn.workers.UvicornWorker"

# Connection handling
worker_connections = 1000
timeout = 120  # 2 minutes
keepalive = 5  # 5 seconds

# Memory management
max_requests = 1000  # Restart worker after 1000 requests
max_requests_jitter = 50  # Add randomness

# Performance
preload_app = True  # Load app before forking (faster)
graceful_timeout = 30  # Graceful shutdown timeout
```

## 🧪 Testing

### Test Concurrent Requests

```bash
# Make 10 concurrent requests
for i in {1..10}; do
  curl -s http://localhost:8000/health > /dev/null &
done
wait
echo "All requests completed!"
```

### Load Testing

```bash
# Install Apache Bench (ab)
sudo apt-get install apache2-utils

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:8000/health
```

## 🔧 Troubleshooting

### Workers Not Starting

1. Check logs:
   ```bash
   docker-compose logs backend
   ```

2. Verify gunicorn_config.py exists:
   ```bash
   docker-compose exec backend ls -la gunicorn_config.py
   ```

3. Check environment variables:
   ```bash
   docker-compose exec backend env | grep GUNICORN
   ```

### High Memory Usage

- Reduce worker count: `GUNICORN_WORKERS=2`
- Lower max_requests: `max_requests = 500`
- Disable preload: `preload_app = False`

### Timeout Issues

- Increase timeout in `gunicorn_config.py`:
  ```python
  timeout = 300  # 5 minutes
  ```

### Worker Crashes

- Check application logs for errors
- Verify database connections are properly pooled
- Check for memory leaks in application code

## 📈 Production Recommendations

1. **Monitor Worker Health**
   - Set up health checks
   - Monitor worker restarts
   - Track request counts per worker

2. **Adjust Based on Load**
   - Start with 4 workers
   - Monitor CPU and memory usage
   - Adjust based on actual traffic patterns

3. **Use Process Manager** (Optional)
   - Consider using systemd or supervisor for process management
   - Or use Docker's restart policies

4. **Load Balancing** (For Multiple Servers)
   - Use nginx or HAProxy in front of Gunicorn
   - Distribute load across multiple backend instances

## 🔄 Comparison: Uvicorn vs Gunicorn

| Feature | Uvicorn (Direct) | Gunicorn + Uvicorn Workers |
|---------|------------------|---------------------------|
| Processes | 1 | Multiple (configurable) |
| Concurrency | High (async) | High (async) + Multi-process |
| Production Ready | ⚠️ Limited | ✅ Yes |
| Process Isolation | ❌ No | ✅ Yes |
| Auto-restart | ❌ No | ✅ Yes (after N requests) |
| Graceful Shutdown | ⚠️ Basic | ✅ Full support |
| Memory Leak Protection | ❌ No | ✅ Yes |

## 📝 Notes

- Gunicorn master process (PID 1) manages worker processes
- Each worker runs a Uvicorn server instance
- Workers are independent - one crash doesn't affect others
- Workers automatically restart after handling max_requests
- Preload app loads the application once before forking (saves memory)

---

**Status**: ✅ Gunicorn is fully configured and running with 4 worker processes!

