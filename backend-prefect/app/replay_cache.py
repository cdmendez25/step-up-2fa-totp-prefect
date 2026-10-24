"""Caché anti-replay en memoria.

Recuerda cada par (user_id, código) ya usado durante 90 s: las 3 ventanas
aceptadas (C-1, C, C+1) × 30 s. Pasado ese tiempo el código ya no sería válido
de todos modos, así que se olvida.
"""

import threading
import time

TTL_SECONDS = 90


class ReplayCache:
    def __init__(self, ttl_seconds: int = TTL_SECONDS) -> None:
        self._ttl = ttl_seconds
        self._used: dict[tuple[str, str], float] = {}
        self._lock = threading.Lock()  # las tasks de Prefect pueden correr en hilos distintos

    def seconds_since_use(self, user_id: str, code: str) -> float | None:
        now = time.monotonic()
        with self._lock:
            self._purge(now)
            used_at = self._used.get((user_id, code))
        return None if used_at is None else now - used_at

    def mark_used(self, user_id: str, code: str) -> None:
        with self._lock:
            self._used[(user_id, code)] = time.monotonic()

    def _purge(self, now: float) -> None:
        for key in [key for key, used_at in self._used.items() if now - used_at > self._ttl]:
            del self._used[key]


replay_cache = ReplayCache()
