import os

import pytest

# Mevcut ortam değişkeni yoksa test anahtarı kullan (load_dotenv mevcut değeri ezmez)
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key-for-pytest")

import server  # noqa: E402


@pytest.fixture
def app():
    server.app.config["TESTING"] = True
    server.limiter.enabled = False
    return server.app


@pytest.fixture
def client(app):
    return app.test_client()
