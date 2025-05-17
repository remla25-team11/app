FROM python:3.12-slim

WORKDIR /app

# Install git (and any other needed dependencies)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . .

ENV URL_MODEL_SERVICE=http://model-service:8000/predict
ENV URL_MODEL_VERSION=http://model-service:8000/version

EXPOSE 5000

CMD ["python", "app.py"]
