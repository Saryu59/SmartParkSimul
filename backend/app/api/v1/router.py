from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.slots import router as slots_router
from app.api.v1.reservations import router as reservations_router
from app.api.v1.checkin import router as checkin_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.sensor import router as sensor_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(slots_router)
api_v1_router.include_router(reservations_router)
api_v1_router.include_router(checkin_router)
api_v1_router.include_router(recommendations_router)
api_v1_router.include_router(sensor_router)
api_v1_router.include_router(admin_router)
