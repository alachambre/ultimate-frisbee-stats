from fastapi import HTTPException
import pytest

from app.auth.verification import parse_bearer_token


def test_parse_bearer_token_returns_none_when_header_missing():
    assert parse_bearer_token(None) is None


def test_parse_bearer_token_returns_token_for_valid_header():
    assert parse_bearer_token("Bearer token-123") == "token-123"


@pytest.mark.parametrize(
    "authorization_header",
    [
        "",
        "Bearer",
        "Basic token-123",
        "Bearer token-123 extra",
    ],
)
def test_parse_bearer_token_rejects_malformed_headers(authorization_header):
    with pytest.raises(HTTPException) as exc_info:
        parse_bearer_token(authorization_header)

    assert exc_info.value.status_code == 401
