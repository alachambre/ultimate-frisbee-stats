"""Small in-process TTL cache for read-only statistics responses."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
import os
from threading import RLock
import time
from typing import Any, Callable, Optional, Sequence

from app.logging_config import get_logger


DEFAULT_STATISTICS_CACHE_TTL_SECONDS = 300
STATISTICS_CACHE_TTL_ENV = "STATISTICS_CACHE_TTL_SECONDS"

logger = get_logger("statistics_cache")


@dataclass(frozen=True)
class _CacheEntry:
    value: Any
    expires_at: float


_CACHE_MISS = object()
_cache: dict[str, _CacheEntry] = {}
_lock = RLock()


def get_statistics_cache_ttl_seconds() -> int:
    """Return the configured statistics cache TTL, clamped at zero."""
    raw_value = os.getenv(
        STATISTICS_CACHE_TTL_ENV,
        str(DEFAULT_STATISTICS_CACHE_TTL_SECONDS),
    )
    try:
        return max(0, int(raw_value))
    except ValueError:
        logger.warning(
            "Invalid %s=%r; using default ttl=%s",
            STATISTICS_CACHE_TTL_ENV,
            raw_value,
            DEFAULT_STATISTICS_CACHE_TTL_SECONDS,
        )
        return DEFAULT_STATISTICS_CACHE_TTL_SECONDS


def _normalize_ids(values: Optional[Sequence[int]]) -> tuple[int, ...]:
    if not values:
        return ()
    return tuple(sorted(set(values)))


def _format_ids(values: Optional[Sequence[int]]) -> str:
    normalized = _normalize_ids(values)
    if not normalized:
        return "all"
    return ",".join(str(value) for value in normalized)


def build_statistics_cache_key(
    endpoint: str,
    scope_id: int,
    *,
    competition_ids: Optional[Sequence[int]] = None,
    game_ids: Optional[Sequence[int]] = None,
    player_ids: Optional[Sequence[int]] = None,
) -> str:
    return (
        f"statistics:{endpoint}:{scope_id}:"
        f"competitions={_format_ids(competition_ids)}:"
        f"games={_format_ids(game_ids)}:"
        f"players={_format_ids(player_ids)}"
    )


def _get_cached_value(key: str) -> Any:
    ttl_seconds = get_statistics_cache_ttl_seconds()
    if ttl_seconds <= 0:
        return _CACHE_MISS

    now = time.monotonic()
    with _lock:
        entry = _cache.get(key)
        if entry is None:
            return _CACHE_MISS
        if entry.expires_at <= now:
            del _cache[key]
            return _CACHE_MISS
        return deepcopy(entry.value)


def _set_cached_value(key: str, value: Any) -> None:
    ttl_seconds = get_statistics_cache_ttl_seconds()
    if ttl_seconds <= 0 or value is None:
        return

    entry = _CacheEntry(
        value=deepcopy(value),
        expires_at=time.monotonic() + ttl_seconds,
    )
    with _lock:
        _cache[key] = entry


def clear_statistics_cache(reason: str = "mutation") -> int:
    """Clear all cached statistics responses and return removed entry count."""
    with _lock:
        cleared_entries = len(_cache)
        _cache.clear()

    if cleared_entries:
        logger.info(
            "statistics_cache_cleared reason=%s entries=%s",
            reason,
            cleared_entries,
        )
    return cleared_entries


def get_statistics_cache_size() -> int:
    with _lock:
        return len(_cache)


def get_or_set_statistics_cache(
    endpoint: str,
    scope_id: int,
    loader: Callable[[], Any],
    *,
    competition_ids: Optional[Sequence[int]] = None,
    game_ids: Optional[Sequence[int]] = None,
    player_ids: Optional[Sequence[int]] = None,
) -> Any:
    """Return a cached statistics value, or load/cache a successful response."""
    start = time.perf_counter()
    ttl_seconds = get_statistics_cache_ttl_seconds()
    cache_enabled = ttl_seconds > 0
    key = build_statistics_cache_key(
        endpoint,
        scope_id,
        competition_ids=competition_ids,
        game_ids=game_ids,
        player_ids=player_ids,
    )

    if cache_enabled:
        cached_value = _get_cached_value(key)
        if cached_value is not _CACHE_MISS:
            _log_statistics_read(
                endpoint,
                scope_id,
                competition_ids,
                game_ids,
                player_ids,
                cache_enabled=True,
                cache_hit=True,
                duration_ms=_elapsed_ms(start),
            )
            return cached_value

    value = loader()
    if cache_enabled and value is not None:
        _set_cached_value(key, value)

    _log_statistics_read(
        endpoint,
        scope_id,
        competition_ids,
        game_ids,
        player_ids,
        cache_enabled=cache_enabled,
        cache_hit=False,
        duration_ms=_elapsed_ms(start),
    )
    return value


def _elapsed_ms(start: float) -> float:
    return (time.perf_counter() - start) * 1000


def _log_statistics_read(
    endpoint: str,
    scope_id: int,
    competition_ids: Optional[Sequence[int]],
    game_ids: Optional[Sequence[int]],
    player_ids: Optional[Sequence[int]],
    *,
    cache_enabled: bool,
    cache_hit: bool,
    duration_ms: float,
) -> None:
    logger.info(
        (
            "statistics_read endpoint=%s scope_id=%s "
            "competition_filter_count=%s game_filter_count=%s "
            "player_filter_count=%s cache_enabled=%s cache_hit=%s "
            "duration_ms=%.2f"
        ),
        endpoint,
        scope_id,
        len(_normalize_ids(competition_ids)),
        len(_normalize_ids(game_ids)),
        len(_normalize_ids(player_ids)),
        cache_enabled,
        cache_hit,
        duration_ms,
    )
