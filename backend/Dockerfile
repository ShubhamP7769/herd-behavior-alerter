# backend/Dockerfile
FROM python:3.12

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire 'app' folder
COPY app ./app

# Expose port
EXPOSE 8000

# Start uvicorn pointing to app.main
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
