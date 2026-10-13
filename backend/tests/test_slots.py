import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_all_six_slots(client: AsyncClient):
    response = await client.get("/api/v1/slots")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 6
    slot_ids = [s["id"] for s in data]
    assert slot_ids == ["A1", "A2", "A3", "B1", "B2", "B3"]


@pytest.mark.asyncio
async def test_get_single_slot(client: AsyncClient):
    response = await client.get("/api/v1/slots/A1")
    assert response.status_code == 200
    slot = response.json()
    assert slot["id"] == "A1"
    assert slot["zone"] == "A"
    assert slot["isAccessible"] is True
    assert slot["sensor"]["gpioPin"] == 21


@pytest.mark.asyncio
async def test_toggle_slot_maintenance_admin(client: AsyncClient, admin_token: str):
    # Set maintenance
    response = await client.post(
        "/api/v1/slots/A1/maintenance",
        json={"isMaintenance": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "OUT_OF_SERVICE"
    assert response.json()["isMaintenance"] is True

    # Restore maintenance
    response2 = await client.post(
        "/api/v1/slots/A1/maintenance",
        json={"isMaintenance": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response2.status_code == 200
    assert response2.json()["status"] == "AVAILABLE"


@pytest.mark.asyncio
async def test_toggle_slot_maintenance_forbidden_for_user(client: AsyncClient, driver_token: str):
    response = await client.post(
        "/api/v1/slots/A1/maintenance",
        json={"isMaintenance": True},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert response.status_code == 403
