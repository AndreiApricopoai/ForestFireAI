"""
main.py

Entry point for the Python detection worker service.

This file does two things:
    1. Starts a FastAPI HTTP server so NestJS can control the workers
       (start/stop individual cameras, check status)
    2. On startup, loads the YOLO model and spawns one worker thread
       per active camera fetched from the NestJS backend

To run this service:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    or simply:
    python main.py
"""

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException

from config import SERVICE_PORT
from worker_manager import WorkerManager


# ---------------------------------------------------------------------------
# Create the WorkerManager — this also loads the YOLO model
# It is created at module level so all route handlers can access it
# ---------------------------------------------------------------------------
manager = WorkerManager()


# ---------------------------------------------------------------------------
# Lifespan handler
# FastAPI's lifespan replaces the old @app.on_event("startup") pattern.
# Code before 'yield' runs on startup, code after 'yield' runs on shutdown.
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On startup:
        - Fetch active cameras from NestJS
        - Start one worker thread per active camera

    On shutdown:
        - Signal all worker threads to stop cleanly
    """
    print("[Main] Detection worker service starting up...")
    manager.load_cameras_from_backend()
    print("[Main] All startup workers launched. Service is ready.")

    yield  # The application runs here — everything above is startup, below is shutdown

    print("[Main] Detection worker service shutting down...")
    manager.stop_all_workers()
    print("[Main] Shutdown complete.")


# ---------------------------------------------------------------------------
# Create the FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Forest Fire Detection Worker",
    description="Controls camera processing threads and reports detection status.",
    version="1.0.0",
    lifespan=lifespan
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/status")
def get_status():
    """
    Return the current status of all camera worker threads.

    NestJS or an admin can call this to inspect the system.
    Returns a list of workers with their running state.
    """
    workers = manager.get_status()

    return {
        "workerCount": len(workers),
        "workers": workers
    }


@app.post("/workers/{camera_id}/start")
def start_worker(camera_id: str, camera: dict):
    """
    Start processing a specific camera.

    NestJS calls this endpoint when an admin re-enables a camera.
    The full camera object must be passed in the request body
    so the worker knows the video path and settings.

    Example request body:
    {
        "id": "drone_001",
        "name": "Drone Alpha",
        "sourceUrl": "drone_alpha.mp4",
        "analysisIntervalSeconds": 5,
        "confidenceThreshold": 0.45
    }
    """
    # Make sure the camera ID in the URL matches the one in the body
    if camera.get("id") != camera_id:
        raise HTTPException(
            status_code=400,
            detail="Camera ID in URL does not match camera ID in request body."
        )

    manager.start_worker(camera)

    return {
        "message": f"Worker for camera '{camera_id}' has been started.",
        "cameraId": camera_id
    }


@app.post("/workers/{camera_id}/stop")
def stop_worker(camera_id: str):
    """
    Stop processing a specific camera.

    NestJS calls this endpoint when an admin disables a camera.
    The worker thread will finish its current frame and then exit cleanly.
    """
    manager.stop_worker(camera_id)

    return {
        "message": f"Worker for camera '{camera_id}' has been stopped.",
        "cameraId": camera_id
    }


# ---------------------------------------------------------------------------
# Run the server directly when executing: python main.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        app=app,
        host="0.0.0.0",
        port=SERVICE_PORT,
        reload=False  # Set to True during development if you want auto-reload
    )
