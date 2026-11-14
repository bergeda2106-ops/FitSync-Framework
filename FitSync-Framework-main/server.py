import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Trust X-Forwarded-* from Nginx (rate limit + logs see real client IP).
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Only these browser origins may call the API (no wildcard).
_cors_origins = ["http://localhost:8080"]
_prod_origin = os.environ.get("FITSYNC_PRODUCTION_ORIGIN", "").strip().rstrip("/")
if _prod_origin:
    _cors_origins.append(_prod_origin)

CORS(
    app,
    origins=_cors_origins,
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})


@app.route('/api/ai', methods=['POST'])
@limiter.limit("30 per minute")
def proxy_gemini():
    if not GEMINI_API_KEY:
        return jsonify({"error": {"message": "Server configuration error: Missing API Key"}}), 500

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or 'contents' not in data:
        return jsonify({"error": {"message": "Invalid request payload"}}), 400

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={'Content-Type': 'application/json'},
            timeout=(5, 30),
        )
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
    port = int(os.environ.get('PORT', '5000'))
    debug = os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    print(f"Starting FitSync Python Proxy Server on http://localhost:{port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)
