# Using slim cuz faster
# can be removed
FROM  python:3.12-slim

WORKDIR /app

COPY requirements.txt .

# --no-cache-dir reduces image size
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

ENV URL_MODEL_SERVICE=http://model-service:8080/predict
ENV URL_MODEL_VERSION=http://model-service:8080/model/version

EXPOSE 5000

CMD ["python", "app.py"]