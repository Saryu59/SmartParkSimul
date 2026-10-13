import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, async_session_factory
from app.db.base import Base
from app.db.seed import seed_database
from app.api.v1.router import api_v1_router
from app.websocket.manager import ws_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartpark")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SmartPark database and tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed initial testbed state (slots, default accounts)
    async with async_session_factory() as db:
        await seed_database(db, wipe=False)
    logger.info("SmartPark database initialization and seeding complete.")

    yield

    logger.info("Shutting down SmartPark backend...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="IoT-Based Smart Parking and Slot Management System Backend (FastAPI, PostgreSQL/SQLite, WebSockets, ESP32 Sensor Protocol)",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_v1_router)


# Health check
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "sensorMode": settings.SENSOR_MODE,
        "database": "connected",
        "slotsConfigured": settings.MAX_SLOTS,
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Welcome to SmartPark IoT Backend API",
        "docsUrl": "/docs",
        "health": "/health",
        "apiBase": "/api/v1",
        "wsUrl": "/ws/live",
    }


# Live WebSocket Endpoint
@app.websocket("/ws/live")
@app.websocket("/api/v1/ws/live")
@app.websocket("/slots/live")
@app.websocket("/reservations/live")
@app.websocket("/ws/live/slots/live")
@app.websocket("/ws/live/reservations/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open, handle client heartbeats
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client terminated: {e}")
        ws_manager.disconnect(websocket)
