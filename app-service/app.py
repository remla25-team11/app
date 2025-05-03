import requests
from flask import Flask, jsonify, request
import os

app = Flask(__name__)

URL_MODEL_SERVICE = os.environ.get("URL_MODEL_SERVICE", "http://localhost:5001/predict")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data or "body" not in data:
        return jsonify({"error": "Missing 'body' in request"}), 400
    
    try:
        response = requests.post(URL_MODEL_SERVICE, json={"body": data["body"]})
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 502

@app.route("/version", methods=["GET"])
def version():
    return jsonify({"version": "version-placeholder"}), 200

if __name__ == "__main__":
    app.run(host = "0.0.0.0", port = 5000)

