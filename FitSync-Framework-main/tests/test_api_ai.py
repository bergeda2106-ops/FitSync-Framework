from unittest.mock import MagicMock, patch

import pytest
import requests

import server


def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}


class TestApiAiInvalidPayload:
    @pytest.mark.parametrize(
        "payload",
        [
            {},
            {"role": "user"},
        ],
    )
    def test_missing_contents_key_returns_400(self, client, payload):
        res = client.post("/api/ai", json=payload)
        assert res.status_code == 400
        assert res.get_json()["error"]["message"] == "Invalid request payload"

    def test_null_json_body_returns_400(self, client):
        # Flask/Werkzeug: gövde "null" JSON — parse sonrası request.json None
        res = client.post(
            "/api/ai",
            data="null",
            content_type="application/json",
        )
        assert res.status_code == 400

    def test_malformed_json_body_returns_400(self, client):
        res = client.post(
            "/api/ai",
            data="{invalid json",
            content_type="application/json",
        )
        assert res.status_code == 400
        assert res.get_json()["error"]["message"] == "Invalid request payload"


class TestApiAiMissingApiKey:
    def test_returns_500_when_key_missing(self, client):
        payload = {"contents": [{"role": "user", "parts": [{"text": "hi"}]}]}
        with patch.object(server, "GEMINI_API_KEY", ""):
            res = client.post("/api/ai", json=payload)
        assert res.status_code == 500
        data = res.get_json()
        assert "Missing API Key" in data["error"]["message"]


class TestApiAiGeminiErrors:
    @patch("server.requests.post")
    def test_success_proxies_gemini_json(self, mock_post, client):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {"candidates": [{"content": {"parts": [{"text": "ok"}]}}]}
        mock_post.return_value = mock_resp

        payload = {"contents": [{"role": "user", "parts": [{"text": "merhaba"}]}]}
        res = client.post("/api/ai", json=payload)

        assert res.status_code == 200
        assert res.get_json()["candidates"][0]["content"]["parts"][0]["text"] == "ok"
        mock_post.assert_called_once()
        call_kw = mock_post.call_args[1]
        assert call_kw["json"] == payload
        assert call_kw["timeout"] == (5, 30)
        assert "generativelanguage.googleapis.com" in mock_post.call_args[0][0]

    @patch("server.requests.post")
    def test_http_error_returns_upstream_json_and_status(self, mock_post, client):
        err_body = {"error": {"code": 429, "message": "Resource exhausted"}}
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_resp.json.return_value = err_body
        mock_resp.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_resp)
        mock_post.return_value = mock_resp

        res = client.post(
            "/api/ai",
            json={"contents": [{"role": "user", "parts": [{"text": "x"}]}]},
        )

        assert res.status_code == 429
        assert res.get_json() == err_body

    @patch("server.requests.post")
    def test_http_error_non_json_body_returns_500_with_text(self, mock_post, client):
        mock_resp = MagicMock()
        mock_resp.status_code = 503
        mock_resp.text = "Service Unavailable"
        mock_resp.json.side_effect = ValueError("not json")
        mock_resp.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_resp)
        mock_post.return_value = mock_resp

        res = client.post(
            "/api/ai",
            json={"contents": [{"role": "user", "parts": [{"text": "x"}]}]},
        )

        assert res.status_code == 500
        assert res.get_json()["error"]["message"] == "Service Unavailable"

    @patch("server.requests.post")
    def test_connection_error_returns_500(self, mock_post, client):
        mock_post.side_effect = requests.exceptions.ConnectionError("Connection refused")

        res = client.post(
            "/api/ai",
            json={"contents": [{"role": "user", "parts": [{"text": "x"}]}]},
        )

        assert res.status_code == 500
        assert "Connection refused" in res.get_json()["error"]["message"]
