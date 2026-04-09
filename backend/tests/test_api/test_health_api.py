def test_health_returns_ready_metadata(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "ultimate-frisbee-stats-api",
        "version": "1.0.0",
    }
