FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Set PYTHONPATH so Python can find the backend module
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run the application with Gunicorn
# Use gunicorn with uvicorn workers for production
CMD ["gunicorn", "app.main:app", "-c", "gunicorn_config.py"]

