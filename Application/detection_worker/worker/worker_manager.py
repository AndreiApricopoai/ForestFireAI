"""
worker_manager.py

The WorkerManager is the central coordinator for all camera threads.
It is responsible for:
    - Loading the YOLO model once (shared across all workers)
    - Fetching the active camera list from NestJS on startup
    - Starting and stopping individual CameraWorker threads
    - Reporting the current status of all workers
"""

import sys
import requests

from config import BACKEND_URL
from detector import FireDetector
from camera_worker import CameraWorker


def check_backend_health():
    """
    Call the NestJS GET /health endpoint to confirm the backend is running.

    If the backend is not reachable, we log the error and exit immediately.
    There is no point starting camera workers if there is nowhere to send results.

    Returns True if healthy, False otherwise.
    """
    url = f"{BACKEND_URL}/health"
    print(f"[HealthCheck] Checking backend health at: {url}")

    try:
        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()
            print(f"[HealthCheck] Backend is healthy. Status: {data.get('status')} | Service: {data.get('service')}")
            return True
        else:
            print(f"[HealthCheck] Backend returned unexpected status: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print(f"[HealthCheck] ERROR: Cannot connect to NestJS backend at {BACKEND_URL}")
        print("[HealthCheck] Make sure the backend is running before starting the worker.")
        return False

    except requests.exceptions.Timeout:
        print(f"[HealthCheck] ERROR: Health check request timed out after 5 seconds.")
        return False

    except Exception as error:
        print(f"[HealthCheck] ERROR: Unexpected error during health check: {error}")
        return False


class WorkerManager:
    """
    Manages all CameraWorker instances.
    There is one WorkerManager in the entire application, created in main.py.
    """

    def __init__(self):
        """
        Set up the manager.
        The YOLO model is loaded here — this is expensive (takes a few seconds)
        so we do it once and share the same detector across all worker threads.
        """

        # Dictionary that maps camera_id (string) -> CameraWorker instance
        # Example: { "drone_001": <CameraWorker>, "tower_002": <CameraWorker> }
        self.workers = {}

        # Load the YOLO model once — all workers share this same detector object
        # YOLO inference itself is thread-safe for reading (running predictions)
        self.detector = FireDetector()

    def load_cameras_from_backend(self):
        """
        Called once on startup.
        First checks backend health, then fetches all cameras and starts workers.
        Aborts entirely if the backend is not reachable.
        """
        # Health check — abort if backend is down
        backend_is_healthy = check_backend_health()
        if not backend_is_healthy:
            print("[Manager] Aborting startup — backend is not available.")
            sys.exit(1)

        print(f"[Manager] Fetching cameras from NestJS at: {BACKEND_URL}/cameras")

        try:
            response = requests.get(f"{BACKEND_URL}/cameras", timeout=10)

            if response.status_code != 200:
                print(f"[Manager] Failed to fetch cameras. HTTP status: {response.status_code}")
                return

            all_cameras = response.json()

            # Only start workers for cameras that are marked as active
            active_cameras = []
            for camera in all_cameras:
                if camera.get("isActive") is True:
                    active_cameras.append(camera)

            print(f"[Manager] Total cameras: {len(all_cameras)}. Active: {len(active_cameras)}.")

            # Start one worker thread per active camera
            for camera in active_cameras:
                self.start_worker(camera)

        except requests.exceptions.ConnectionError:
            print(f"[Manager] Could not connect to NestJS at {BACKEND_URL}.")
            print("[Manager] No workers started. You can start them manually via the API.")

        except Exception as error:
            print(f"[Manager] Unexpected error loading cameras: {error}")

    def start_worker(self, camera):
        """
        Start a worker thread for the given camera.

        Parameters:
            camera - a dictionary with camera data. Expected fields:
                     "id", "name", "sourceUrl",
                     "analysisIntervalSeconds" (optional),
                     "confidenceThreshold" (optional)
        """
        camera_id = camera.get("id")

        if camera_id is None:
            print("[Manager] Cannot start worker: camera data is missing 'id' field.")
            return

        # If a worker already exists and is running, do not start a duplicate
        if camera_id in self.workers and self.workers[camera_id].is_running():
            print(f"[Manager] Worker for camera '{camera_id}' is already running.")
            return

        # Create a new CameraWorker with the camera's settings
        worker = CameraWorker(
            camera_id=camera_id,
            camera_name=camera.get("name", "Unknown"),
            source_url=camera.get("sourceUrl", ""),
            detector=self.detector,
            analysis_interval=camera.get("analysisIntervalSeconds"),
            confidence_threshold=camera.get("confidenceThreshold")
        )

        # Store it in the dictionary so we can reference it later
        self.workers[camera_id] = worker

        # Start the thread
        worker.start()

    def stop_worker(self, camera_id):
        """
        Stop the worker thread for the given camera ID.
        The thread will finish its current frame processing before stopping.

        Parameters:
            camera_id - the unique ID of the camera to stop
        """
        if camera_id not in self.workers:
            print(f"[Manager] No worker found for camera ID: {camera_id}")
            return

        self.workers[camera_id].stop()

    def stop_all_workers(self):
        """
        Stop all running worker threads.
        Called when the FastAPI server is shutting down.
        """
        print(f"[Manager] Stopping all {len(self.workers)} workers...")

        for camera_id in self.workers:
            worker = self.workers[camera_id]
            if worker.is_running():
                worker.stop()

        print("[Manager] All workers have been stopped.")

    def get_status(self):
        """
        Return a list of status dicts for all known workers.
        Used by the GET /status endpoint so you can inspect the system at runtime.

        Returns a list like:
            [
                { "cameraId": "drone_001", "cameraName": "Drone Alpha",
                  "status": "running", "isRunning": True, "errorMessage": None },
                ...
            ]
        """
        status_list = []

        for camera_id in self.workers:
            worker = self.workers[camera_id]

            status_entry = {
                "cameraId": camera_id,
                "cameraName": worker.camera_name,
                "status": worker.status,
                "isRunning": worker.is_running(),
                "errorMessage": worker.error_message
            }

            status_list.append(status_entry)

        return status_list
