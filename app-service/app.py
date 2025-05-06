import requests
from flask import Flask, jsonify, request, Blueprint
import os
import uuid 

app = Flask(__name__)

URL_MODEL_SERVICE = os.environ.get("URL_MODEL_SERVICE", "http://localhost:8080/predict")
URL_MODEL_VERSION = os.environ.get("URL_MODEL_VERSION", "http://localhost:5001/model/version")

api = Blueprint('api', __name__, url_prefix='/api')

@api.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' in request"}), 400
    
    try:
        response = requests.post(URL_MODEL_SERVICE, json={"review": data["text"]})
        result = response.json()
        return jsonify({
            "sentiment": result.get("prediction", "unknown"),
            "score": 1.0 if result.get("prediction") == "positive" else 0.0,
            "id": str(uuid.uuid4())
        }), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 502


@api.route("/model/version", methods=["GET"])
def model_version():
    try:
        response = requests.get(URL_MODEL_VERSION)
        return jsonify(response.json()), response.status_code
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 502
    

@api.route("/version", methods=["GET"])
def version():
    return jsonify({"version": "version-placeholder"}), 200


@api.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    print("Feedback received success, data:", data)
    return jsonify({"message": "Feedback received"}), 200


if __name__ == "__main__":
    app.register_blueprint(api)
    app.run(host = "0.0.0.0", port = 5000)

