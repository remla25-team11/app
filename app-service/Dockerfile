# The final, corrected content for app/app-service/Dockerfile

FROM python:3.12-slim

WORKDIR /app

# --- FIX IS HERE ---
# Install git, which is needed by pip to install packages from git repositories.
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Correctly copy the requirements file from its location relative to the project root
COPY app/app-service/requirements.txt .

# Install dependencies
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Correctly copy ONLY the application's source code
COPY app/app-service/app.py .

# Sanity check to ensure the /health route is in the copied file
RUN grep -q "/health" app.py

# Expose the correct port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
