import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Allow CORS so our frontend on localhost:8000 can talk to localhost:5000
CORS(app)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

@app.route('/api/ai', methods=['POST'])
def proxy_gemini():
    if not GEMINI_API_KEY:
        return jsonify({"error": {"message": "Server configuration error: Missing API Key"}}), 500

    data = request.json
    if not data or 'contents' not in data:
        return jsonify({"error": {"message": "Invalid request payload"}}), 400

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        # If response has JSON content, return it, else return generic error
        error_msg = str(e)
        if hasattr(e.response, 'text'):
            try:
                return jsonify(e.response.json()), e.response.status_code
            except:
                error_msg = e.response.text
                
        return jsonify({"error": {"message": error_msg}}), 500

if __name__ == '__main__':
    print("Starting FitSync Python Proxy Server on http://localhost:5000")
    app.run(debug=True, port=5000)
