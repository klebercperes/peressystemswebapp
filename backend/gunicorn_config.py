"""
Gunicorn configuration file for production deployment
"""
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
# Formula: (2 x CPU cores) + 1
# For Docker, default to 4 workers (can be overridden via env var)
workers = int(os.getenv("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120  # 2 minutes - for long-running requests
keepalive = 5  # Keep connections alive for 5 seconds

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = os.getenv("LOG_LEVEL", "info").lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "msp_backend"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_redirect = False

# SSL (if needed in future)
# keyfile = None
# certfile = None

# Performance tuning
max_requests = 1000  # Restart worker after this many requests (prevent memory leaks)
max_requests_jitter = 50  # Add randomness to max_requests
preload_app = True  # Load application code before forking workers (faster startup)

# Graceful timeout for worker shutdown
graceful_timeout = 30

# Worker timeout for handling requests
# worker_tmp_dir = "/dev/shm"  # Use shared memory for worker temp files (faster) - uncomment if /dev/shm exists

