from app.statistics_cache import (
    build_statistics_cache_key,
    clear_statistics_cache,
    get_or_set_statistics_cache,
    get_statistics_cache_size,
)


def test_statistics_cache_key_normalizes_filter_order():
    key = build_statistics_cache_key(
        "team_team",
        12,
        competition_ids=[4, 3, 4],
        game_ids=[9, 8],
        player_ids=[7, 9, 7],
    )

    assert key == (
        "statistics:team_team:12:"
        "competitions=3,4:games=8,9:players=7,9"
    )


def test_statistics_cache_reuses_cached_value_and_returns_copy(monkeypatch):
    monkeypatch.setenv("STATISTICS_CACHE_TTL_SECONDS", "300")
    calls = 0

    def loader():
        nonlocal calls
        calls += 1
        return {"items": [{"value": calls}]}

    first_value = get_or_set_statistics_cache("team_team", 1, loader)
    first_value["items"][0]["value"] = 99

    second_value = get_or_set_statistics_cache("team_team", 1, loader)

    assert calls == 1
    assert second_value == {"items": [{"value": 1}]}
    assert get_statistics_cache_size() == 1


def test_statistics_cache_expires_after_ttl(monkeypatch):
    monkeypatch.setenv("STATISTICS_CACHE_TTL_SECONDS", "5")
    current_time = [1000.0]
    monkeypatch.setattr(
        "app.statistics_cache.time.monotonic",
        lambda: current_time[0],
    )
    calls = 0

    def loader():
        nonlocal calls
        calls += 1
        return {"value": calls}

    assert get_or_set_statistics_cache("team_team", 1, loader) == {"value": 1}

    current_time[0] += 4.9
    assert get_or_set_statistics_cache("team_team", 1, loader) == {"value": 1}

    current_time[0] += 0.2
    assert get_or_set_statistics_cache("team_team", 1, loader) == {"value": 2}
    assert calls == 2
    assert get_statistics_cache_size() == 1


def test_statistics_cache_can_be_disabled(monkeypatch):
    monkeypatch.setenv("STATISTICS_CACHE_TTL_SECONDS", "0")
    clear_statistics_cache("test_disabled")
    calls = 0

    def loader():
        nonlocal calls
        calls += 1
        return {"value": calls}

    assert get_or_set_statistics_cache("team_team", 1, loader) == {"value": 1}
    assert get_or_set_statistics_cache("team_team", 1, loader) == {"value": 2}
    assert calls == 2
    assert get_statistics_cache_size() == 0
