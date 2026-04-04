# Gunicorn — FitSync Flask API (use with: gunicorn -c deploy/gunicorn.conf.py "server:app")
import multiprocessing
import os

_bind = os.environ.get("GUNICORN_BIND", "127.0.0.1:8000")
bind = _bind

# Sync workers: (2 × CPU) + 1 is a common default; override with WEB_CONCURRENCY.
_workers = os.environ.get("WEB_CONCURRENCY")
workers = int(_workers) if _workers else multiprocessing.cpu_count() * 2 + 1

worker_class = "sync"
threads = 1
timeout = 120
graceful_timeout = 30
keepalive = 5
max_requests = 2000
max_requests_jitter = 200

accesslog = os.environ.get("GUNICORN_ACCESSLOG", "-")
errorlog = os.environ.get("GUNICORN_ERRORLOG", "-")
loglevel = os.environ.get("GUNICORN_LOGLEVEL", "info")
capture_output = True

# Flask-Limiter uses in-memory storage: limits are per worker unless you switch to Redis.
preload_app = False
