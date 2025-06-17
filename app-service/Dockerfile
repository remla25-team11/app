# In app/app-service/Dockerfile

FROM python:3.12-slim

WORKDIR /app

# Install git if needed for pip installs
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# This path is now correct because the build context is the project root
COPY app/app-service/requirements.txt .

# Install dependencies
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# This path is also correct now
COPY app/app-service/app.py .

EXPOSE 5000

# This is the command to run the application
CMD ["python", "app.py"]
