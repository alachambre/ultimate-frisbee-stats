from app import main


def test_initialize_database_with_retry_retries_until_success(monkeypatch):
    attempts = {"count": 0}
    sleep_calls: list[float] = []

    def flaky_initialize():
        attempts["count"] += 1
        if attempts["count"] < 3:
            raise RuntimeError("temporary dns failure")

    monkeypatch.setattr(main, "initialize_database_state", flaky_initialize)
    monkeypatch.setattr(main.time, "sleep", sleep_calls.append)
    monkeypatch.setattr(main, "DB_STARTUP_MAX_ATTEMPTS", 4)
    monkeypatch.setattr(main, "DB_STARTUP_INITIAL_DELAY_SECONDS", 2.0)
    monkeypatch.setattr(main, "DB_STARTUP_BACKOFF_MULTIPLIER", 1.5)

    main.initialize_database_with_retry()

    assert attempts["count"] == 3
    assert sleep_calls == [2.0, 3.0]


def test_initialize_database_with_retry_raises_after_last_attempt(monkeypatch):
    attempts = {"count": 0}
    sleep_calls: list[float] = []

    def always_fail():
        attempts["count"] += 1
        raise RuntimeError("still down")

    monkeypatch.setattr(main, "initialize_database_state", always_fail)
    monkeypatch.setattr(main.time, "sleep", sleep_calls.append)
    monkeypatch.setattr(main, "DB_STARTUP_MAX_ATTEMPTS", 3)
    monkeypatch.setattr(main, "DB_STARTUP_INITIAL_DELAY_SECONDS", 1.0)
    monkeypatch.setattr(main, "DB_STARTUP_BACKOFF_MULTIPLIER", 2.0)

    try:
        main.initialize_database_with_retry()
    except RuntimeError as exc:
        assert str(exc) == "still down"
    else:
        raise AssertionError("Expected initialize_database_with_retry to raise")

    assert attempts["count"] == 3
    assert sleep_calls == [1.0, 2.0]
