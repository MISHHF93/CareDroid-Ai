# Anomaly Detection Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY anomaly_detector.py .

# Create a simple web server script
RUN echo '#!/usr/bin/env python3
import subprocess
import threading
import time
from flask import Flask, jsonify

app = Flask(__name__)

def run_anomaly_detection():
    while True:
        try:
            subprocess.run(["python", "anomaly_detector.py"], check=True)
        except Exception as e:
            print(f"Anomaly detection error: {e}")
        time.sleep(300)  # Run every 5 minutes

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "anomaly-detection"})

if __name__ == "__main__":
    # Start anomaly detection in background thread
    detector_thread = threading.Thread(target=run_anomaly_detection, daemon=True)
    detector_thread.start()

    # Start web server
    app.run(host="0.0.0.0", port=8000)
' > web_server.py && chmod +x web_server.py

# Expose port
EXPOSE 8000

# Run the web server
CMD ["python", "web_server.py"]