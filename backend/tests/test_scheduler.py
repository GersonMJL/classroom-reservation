"""Testes do loop periódico do scheduler."""

import asyncio

from app.core.scheduler import run_periodic


def test_run_periodic_invokes_job_until_stopped():
    calls: list[int] = []
    stop_event = asyncio.Event()

    def job() -> None:
        calls.append(1)
        if len(calls) >= 3:
            stop_event.set()

    asyncio.run(run_periodic(job, interval_seconds=0.01, stop_event=stop_event))

    assert len(calls) == 3


def test_run_periodic_stops_immediately_if_event_already_set():
    calls: list[int] = []
    stop_event = asyncio.Event()
    stop_event.set()

    def job() -> None:
        calls.append(1)

    asyncio.run(run_periodic(job, interval_seconds=0.01, stop_event=stop_event))

    assert calls == []
