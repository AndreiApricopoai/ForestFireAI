import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException

from config import SERVICE_PORT
from worker_manager import WorkerManager

manager = WorkerManager()

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("[Main] Detection worker service starting up...")
    manager.load_cameras_from_backend()
    print("[Main] All startup workers launched. Service is ready.")

    yield

    print("[Main] Detection worker service shutting down...")
    manager.stop_all_workers()
    print("[Main] Shutdown complete.")

app = FastAPI(
    title="Forest Fire Detection Worker",
    description="Controls camera processing threads and reports detection status.",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/status")
def get_status():

    workers = manager.get_status()

    return {
        "workerCount": len(workers),
        "workers": workers
    }

@app.post("/workers/{camera_id}/start")
def start_worker(camera_id: str, camera: dict):

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

    manager.stop_worker(camera_id)

    return {
        "message": f"Worker for camera '{camera_id}' has been stopped.",
        "cameraId": camera_id
    }

if __name__ == "__main__":
    uvicorn.run(
        app=app,
        host="0.0.0.0",
        port=SERVICE_PORT,
        reload=False
    )
