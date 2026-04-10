from app import main


def test_health_returns_ready_metadata(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "ultimate-frisbee-stats-api",
        "version": "1.0.0",
        "database": "ok",
    }


def test_health_returns_service_unavailable_when_database_is_unreachable(client, monkeypatch):
    def fail_db_check():
        raise RuntimeError("db unavailable")

    monkeypatch.setattr(main, "check_db_connection", fail_db_check)

    response = client.get("/health")

    assert response.status_code == 503
    assert response.json() == {
        "status": "degraded",
        "service": "ultimate-frisbee-stats-api",
        "version": "1.0.0",
        "database": "unreachable",
    }
