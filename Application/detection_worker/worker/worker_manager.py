import sys
import requests

from config import BACKEND_URL
from detector import FireDetector
from camera_worker import CameraWorker

def check_backend_health():

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

    def __init__(self):

        self.workers = {}

        self.detector = FireDetector()

    def load_cameras_from_backend(self):

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

            active_cameras = []
            for camera in all_cameras:
                if camera.get("isActive") is True:
                    active_cameras.append(camera)

            print(f"[Manager] Total cameras: {len(all_cameras)}. Active: {len(active_cameras)}.")

            for camera in active_cameras:
                self.start_worker(camera)

        except requests.exceptions.ConnectionError:
            print(f"[Manager] Could not connect to NestJS at {BACKEND_URL}.")
            print("[Manager] No workers started. You can start them manually via the API.")

        except Exception as error:
            print(f"[Manager] Unexpected error loading cameras: {error}")

    def start_worker(self, camera):

        camera_id = camera.get("id")

        if camera_id is None:
            print("[Manager] Cannot start worker: camera data is missing 'id' field.")
            return

        if camera_id in self.workers and self.workers[camera_id].is_running():
            print(f"[Manager] Worker for camera '{camera_id}' is already running.")
            return

        worker = CameraWorker(
            camera_id=camera_id,
            camera_name=camera.get("name", "Unknown"),
            source_url=camera.get("sourceUrl", ""),
            detector=self.detector,
            analysis_interval=camera.get("analysisIntervalSeconds"),
            confidence_threshold=camera.get("confidenceThreshold")
        )

        self.workers[camera_id] = worker

        worker.start()

    def stop_worker(self, camera_id):

        if camera_id not in self.workers:
            print(f"[Manager] No worker found for camera ID: {camera_id}")
            return

        self.workers[camera_id].stop()

    def stop_all_workers(self):

        print(f"[Manager] Stopping all {len(self.workers)} workers...")

        for camera_id in self.workers:
            worker = self.workers[camera_id]
            if worker.is_running():
                worker.stop()

        print("[Manager] All workers have been stopped.")

    def get_status(self):

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
