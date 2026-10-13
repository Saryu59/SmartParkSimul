import pytest
from datetime import datetime, timezone
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ingest_sensor_event_vacate_and_park(client: AsyncClient):
    # A1 is initially vacant. Send occupied event.
    now = datetime.now(timezone.utc)
    event_payload = {
        "deviceId": "esp32-node-01",
        "slotId": "A1",
        "isOccupied": True,
        "rawReading": "LOW",
        "deviceTimestamp": now.isoformat(),
        "batteryPercent": 98,
        "signalDbm": -52,
    }
    response = await client.post("/api/v1/sensors/events", json=event_payload)
    assert response.status_code == 200
    assert response.json()["isOccupied"] is True
    assert response.json()["validationResult"] == "PROCESSED"

    # Verify slot status is now OCCUPIED
    slot_res = await client.get("/api/v1/slots/A1")
    assert slot_res.json()["isOccupied"] is True
    assert slot_res.json()["status"] == "OCCUPIED"

    # Send vacant event
    vacate_payload = {
        "deviceId": "esp32-node-01",
        "slotId": "A1",
        "isOccupied": False,
        "rawReading": "HIGH",
        "deviceTimestamp": now.isoformat(),
    }
    res_vacate = await client.post("/api/v1/sensors/events", json=vacate_payload)
    assert res_vacate.status_code == 200

    slot_res2 = await client.get("/api/v1/slots/A1")
    assert slot_res2.json()["isOccupied"] is False
    assert slot_res2.json()["status"] == "AVAILABLE"


@pytest.mark.asyncio
async def test_reject_unknown_slot_id(client: AsyncClient):
    response = await client.post("/api/v1/sensors/events", json={
        "deviceId": "esp32-node-01",
        "slotId": "Z9",
        "isOccupied": True,
    })
    assert response.status_code == 400
    assert "Unknown slot ID" in response.json()["detail"]


@pytest.mark.asyncio
async def test_hardware_status_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/sensors/status")
    assert response.status_code == 200
    data = response.json()
    assert data["totalSlots"] == 6
    assert data["onlineCount"] >= 0
    assert data["mode"] in ["demo", "hardware"]
