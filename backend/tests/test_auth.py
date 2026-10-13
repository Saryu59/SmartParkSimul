import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "alex@smartpark.demo",
        "password": "demo1234",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alex@smartpark.demo"
    assert data["user"]["role"] == "USER"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "alex@smartpark.demo",
        "password": "wrongpassword",
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_new_driver(client: AsyncClient):
    payload = {
        "name": "Jordan Mitchell",
        "email": "jordan@example.com",
        "password": "password123",
        "licensePlate": "NY-7890",
        "role": "USER",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Jordan Mitchell"
    assert data["user"]["email"] == "jordan@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "name": "Alex Duplicate",
        "email": "alex@smartpark.demo",
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_profile_authenticated(client: AsyncClient, driver_token: str):
    response = await client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {driver_token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "alex@smartpark.demo"


@pytest.mark.asyncio
async def test_get_profile_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
