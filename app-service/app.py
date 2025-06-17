import os
import requests
import uuid
from flask import Flask, jsonify, request, Blueprint, Response
from flask_cors import CORS
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
import traceback 

# Initialize Flask App and the SINGLE Blueprint
app = Flask(__name__)
api = Blueprint('api', __name__, url_prefix='/api')
CORS(app) # Apply CORS to the whole app

# --- Metrics Definition ---
REQUEST_COUNT = Counter("webapp_requests_total", "Total number of requests", ["endpoint"])
SENTIMENT_COUNTER = Counter("sentiment_predictions_total", "Count of predicted sentiments", ["sentiment"])
RESPONSE_TIME = Histogram("request_latency_seconds", "Histogram of response times", ["endpoint"])
MODEL_VERSION_GAUGE = Gauge("model_version_info", "Model version info", ["version"])
# Assuming DARKMODE_TOGGLE is defined somewhere, if not this will error.
# If it's not defined, we should add it. Let's add it for safety.
DARKMODE_TOGGLE = Counter("darkmode_toggles_total", "Count of dark mode toggles", ["version"])


# --- Environment URLs ---
URL_MODEL_SERVICE = os.environ.get("URL_MODEL_SERVICE")
URL_MODEL_VERSION = os.environ.get("URL_MODEL_VERSION")

if not URL_MODEL_SERVICE or not URL_MODEL_VERSION:
    print("FATAL: URL_MODEL_SERVICE or URL_MODEL_VERSION environment variables not set.")
    exit(1)


@api.route("/analyze", methods=["POST"])
@RESPONSE_TIME.labels("analyze").time()
def analyze():
    REQUEST_COUNT.labels("analyze").inc()
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' in request"}), 400

    try:
        response = requests.post(URL_MODEL_SERVICE, json={"review": data["text"]})
        response.raise_for_status()
        result = response.json()
        sentiment = result.get("prediction", "unknown")
        SENTIMENT_COUNTER.labels(sentiment).inc()
        return jsonify({
            "sentiment": sentiment,
            "score": 1.0 if sentiment == "positive" else 0.0,
            "id": str(uuid.uuid4())
        }), response.status_code
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to model service: {e}")
        return jsonify({"error": "Failed to connect to model service", "details": str(e)}), 502

@api.route("/model_version", methods=["GET"])
@RESPONSE_TIME.labels("model_version").time()
def model_version():
    REQUEST_COUNT.labels("model_version").inc()
    try:
        response = requests.get(URL_MODEL_VERSION)
        response.raise_for_status()
        version_data = response.json()
        version = version_data.get("version", "unknown")
        MODEL_VERSION_GAUGE.labels(version=version).set(1)
        return jsonify(version_data), response.status_code
    except requests.exceptions.RequestException as e:
        print(f"Error fetching model version from model-service: {e}")
        return jsonify({"error": "Could not fetch model version from model-service", "details": str(e)}), 502


@api.route("/version", methods=["GET"])
def version():
    """
    Get the app version from the lib-version repository's latest GitHub release tag.
    """
    github_api_url = "https://api.github.com/repos/remla25-team11/lib-version/tags"
    try:
        response = requests.get(github_api_url)
        response.raise_for_status()
        tags_info = response.json()
        if tags_info:
            app_version = tags_info[0].get("name", "unknown")
        else:
            app_version = "no-tags-found"
        return jsonify({"version": app_version}), 200
    except requests.exceptions.RequestException as e:
        print(f"Error fetching app version from GitHub API: {e}")
        print(traceback.format_exc())
        return jsonify({"error": "Could not fetch app version", "details": str(e)}), 500

@api.route("/metrics/toggle", methods=["POST"])
def track_dark_toggle():
    try:
        DARKMODE_TOGGLE.labels(version=os.getenv("APP_VERSION", "v1")).inc()
        return '', 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/health', methods=['GET'])
def health():
    """A simple health check endpoint for Kubernetes probes."""
    return jsonify({'status': 'ok'}), 200

@api.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    print("Feedback received success, data:", data)
    return jsonify({"message": "Feedback received"}), 200


@api.route("/metrics")
def metrics():
    """Endpoint for Prometheus scraping."""
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

# --- Final App Setup ---
# Register the single, correctly populated blueprint with the main app
app.register_blueprint(api)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
