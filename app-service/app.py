import requests
from flask import Flask, jsonify, request, Blueprint
import os
import uuid 
from flask_cors import CORS 
from lib_version.lib_version import VersionUtil
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST

app = Flask(__name__)
CORS(app) 

# Metrics
REQUEST_COUNT = Counter("webapp_requests_total", "Total number of requests", ["endpoint"])
SENTIMENT_COUNTER = Counter("sentiment_predictions_total", "Count of predicted sentiments", ["sentiment"])
RESPONSE_TIME = Histogram("request_latency_seconds", "Histogram of response times", ["endpoint"])
MODEL_VERSION_GAUGE = Gauge("model_version_info", "Model version info", ["version"])

# Environment URLs
URL_MODEL_SERVICE = os.environ.get("URL_MODEL_SERVICE", "http://localhost:8000/predict")
URL_MODEL_VERSION = os.environ.get("URL_MODEL_VERSION", "http://localhost:8000/version")

# Blueprint setup
api = Blueprint('api', __name__, url_prefix='/api')

@api.route("/analyze", methods=["POST"])
@RESPONSE_TIME.labels("analyze").time()
def analyze():
    REQUEST_COUNT.labels("analyze").inc()
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' in request"}), 400
    
    try:
        response = requests.post(URL_MODEL_SERVICE, json={"review": data["text"]})
        result = response.json()
        sentiment = result.get("prediction", "unknown")
        SENTIMENT_COUNTER.labels(sentiment).inc()
        return jsonify({
            "sentiment": sentiment,
            "score": 1.0 if sentiment == "positive" else 0.0,
            "id": str(uuid.uuid4())
        }), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 502


@api.route("/model/version", methods=["GET"])
@RESPONSE_TIME.labels("model_version").time()
def model_version():
    REQUEST_COUNT.labels("model_version").inc()
    try:
        response = requests.get(URL_MODEL_VERSION)
        version = response.json().get("version", "unknown")
        MODEL_VERSION_GAUGE.labels(version).set(1)
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 502


@api.route("/version", methods=["GET"])
def version():
    app_version = VersionUtil.get_version()
    return jsonify({"version": app_version}), 200


@api.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    print("Feedback received success, data:", data)
    return jsonify({"message": "Feedback received"}), 200


@api.route("/metrics")
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}


# Register blueprint only once
app.register_blueprint(api)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)