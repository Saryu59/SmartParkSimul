import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_reservation_success(client: AsyncClient, driver_token: str):
    now = datetime.now(timezone.utc)
    start_dt = now + timedelta(hours=2)
    end_dt = now + timedelta(hours=3)

    payload = {
        "slotId": "A1",
        "startTime": start_dt.isoformat(),
        "endTime": end_dt.isoformat(),
        "licensePlate": "EV-999-ZZ",
    }
    response = await client.post(
        "/api/v1/reservations",
        json=payload,
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["slotId"] == "A1"
    assert data["status"] == "UPCOMING"
    assert data["licensePlate"] == "EV-999-ZZ"
    assert "SP-" in data["id"]


@pytest.mark.asyncio
async def test_reject_overlapping_reservation_same_slot(client: AsyncClient, driver_token: str, admin_token: str):
    now = datetime.now(timezone.utc)
    start_dt = now + timedelta(hours=4)
    end_dt = now + timedelta(hours=5)

    # First booking
    res1 = await client.post(
        "/api/v1/reservations",
        json={
            "slotId": "A2",
            "startTime": start_dt.isoformat(),
            "endTime": end_dt.isoformat(),
            "licensePlate": "CAR-111",
        },
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert res1.status_code == 201

    # Overlapping second booking for same slot by different user
    res2 = await client.post(
        "/api/v1/reservations",
        json={
            "slotId": "A2",
            "startTime": (start_dt + timedelta(minutes=15)).isoformat(),
            "endTime": (end_dt + timedelta(minutes=15)).isoformat(),
            "licensePlate": "CAR-222",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res2.status_code == 400
    assert "already has a confirmed booking" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_reject_same_driver_multiple_slots(client: AsyncClient, driver_token: str):
    now = datetime.now(timezone.utc)
    start_dt = now + timedelta(hours=6)
    end_dt = now + timedelta(hours=7)

    # First slot hold
    res1 = await client.post(
        "/api/v1/reservations",
        json={
            "slotId": "A1",
            "startTime": start_dt.isoformat(),
            "endTime": end_dt.isoformat(),
            "licensePlate": "HOLD-888",
        },
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert res1.status_code == 201

    # Attempt to hold a second bay at the same time
    res2 = await client.post(
        "/api/v1/reservations",
        json={
            "slotId": "B2",
            "startTime": start_dt.isoformat(),
            "endTime": end_dt.isoformat(),
            "licensePlate": "HOLD-888",
        },
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert res2.status_code == 400
    assert "already holds Bay" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_check_in_and_check_out(client: AsyncClient, driver_token: str):
    # Driver usr-1 already has a seeded upcoming booking RES-8041 (Bay A3, starting in 15 mins)
    booking_id = "RES-8041"

    # Check In
    check_in_res = await client.post(
        "/api/v1/check-in",
        json={"code": booking_id},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert check_in_res.status_code == 200
    data = check_in_res.json()
    assert data["status"] == "ACTIVE"
    assert data["checkedIn"] is True

    # Check Out
    check_out_res = await client.post(
        f"/api/v1/reservations/{booking_id}/checkout",
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert check_out_res.status_code == 200
    assert check_out_res.json()["status"] == "COMPLETED"

