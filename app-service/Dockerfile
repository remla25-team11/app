# In app/app-service/Dockerfile

FROM python:3.12-slim

WORKDIR /app

# Install git if needed for pip installs
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# The context is now this directory, so we copy files directly.
COPY requirements.txt .
COPY app.py .

EXPOSE 5000

CMD ["python", "app.py"]