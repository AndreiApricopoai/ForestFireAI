import os
import threading
from datetime import datetime, timezone

import cv2
import requests

from config import (
    CAMERAS_FOLDER,
    SNAPSHOTS_FOLDER,
    BACKEND_URL,
    ANALYSIS_INTERVAL_SECONDS,
    CONFIDENCE_THRESHOLD,
    WORKER_TOKEN,
)

class CameraWorker:

    def __init__(self, camera_id, camera_name, source_url, detector,
                 analysis_interval=None, confidence_threshold=None):

        self.camera_id = camera_id
        self.camera_name = camera_name
        self.source_url = source_url
        self.detector = detector

        if analysis_interval is not None:
            self.analysis_interval = analysis_interval
        else:
            self.analysis_interval = ANALYSIS_INTERVAL_SECONDS

        if confidence_threshold is not None:
            self.confidence_threshold = confidence_threshold
        else:
            self.confidence_threshold = CONFIDENCE_THRESHOLD

        self._stop_event = threading.Event()

        self._thread = None

        self.status = "stopped"
        self.error_message = None

    def start(self):

        if self._thread is not None and self._thread.is_alive():
            print(f"[{self.camera_id}] Worker is already running, skipping start.")
            return

        self._stop_event.clear()
        self.status = "running"
        self.error_message = None

        self._thread = threading.Thread(
            target=self._run,
            name=f"worker-{self.camera_id}",
            daemon=True
        )

        self._thread.start()
        print(f"[{self.camera_id}] Worker thread started for: {self.camera_name}")

    def stop(self):

        if self._thread is None or not self._thread.is_alive():
            print(f"[{self.camera_id}] Worker is not running, nothing to stop.")
            return

        print(f"[{self.camera_id}] Sending stop signal to worker...")

        self._stop_event.set()

        self._thread.join(timeout=10)

        self.status = "stopped"
        print(f"[{self.camera_id}] Worker stopped.")

    def is_running(self):

        return self._thread is not None and self._thread.is_alive()

    def _run(self):

        video_path = os.path.join(CAMERAS_FOLDER, self.source_url)

        if not os.path.exists(video_path):
            print(f"[{self.camera_id}] ERROR: Video file not found at: {video_path}")
            self.status = "error"
            self.error_message = f"Video file not found: {video_path}"
            return

        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            print(f"[{self.camera_id}] ERROR: Could not open video: {video_path}")
            self.status = "error"
            self.error_message = "Could not open video file"
            return

        print(f"[{self.camera_id}] Video opened: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 25.0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        frames_per_interval = int(fps * self.analysis_interval)
        if frames_per_interval <= 0:
            frames_per_interval = 1

        current_frame_index = 0

        while not self._stop_event.is_set():

            cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame_index)
            ret, frame = cap.read()

            if not ret:

                print(f"[{self.camera_id}] Could not read frame {current_frame_index}, looping back to start.")
                current_frame_index = 0
                continue

            video_timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))

            print(f"[{self.camera_id}] Analyzing frame at {video_timestamp_ms}ms (frame {current_frame_index}/{total_frames})")

            try:

                annotated_frame, detections = self.detector.analyze_frame(
                    frame=frame,
                    confidence_threshold=self.confidence_threshold
                )

                self._save_snapshot(annotated_frame)

                snapshot_filename = f"{self.camera_id}_latest.jpg"
                payload = {
                    "cameraId": self.camera_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "videoTimestampMs": video_timestamp_ms,
                    "snapshotUrl": f"/snapshots/{snapshot_filename}",
                    "detections": detections
                }

                self._send_detection(payload)

            except Exception as error:
                print(f"[{self.camera_id}] Error during analysis: {error}")

            current_frame_index = current_frame_index + frames_per_interval

            if current_frame_index >= total_frames:
                print(f"[{self.camera_id}] End of video reached, looping back to start.")
                current_frame_index = 0

            self._stop_event.wait(timeout=self.analysis_interval)

        cap.release()
        print(f"[{self.camera_id}] Video capture released. Thread exiting.")

    def _save_snapshot(self, annotated_frame):

        os.makedirs(SNAPSHOTS_FOLDER, exist_ok=True)

        snapshot_filename = f"{self.camera_id}_latest.jpg"
        snapshot_path = os.path.join(SNAPSHOTS_FOLDER, snapshot_filename)

        success = cv2.imwrite(snapshot_path, annotated_frame)

        if success:
            print(f"[{self.camera_id}] Snapshot saved: {snapshot_path}")
        else:
            print(f"[{self.camera_id}] WARNING: Failed to save snapshot to: {snapshot_path}")

    def _send_detection(self, payload):

        url = f"{BACKEND_URL}/detections"

        headers = {
            "Authorization": f"Bearer {WORKER_TOKEN}"
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=5)

            if response.status_code in (200, 201):
                detection_count = len(payload["detections"])
                print(f"[{self.camera_id}] Detection sent OK. Objects found: {detection_count}")
            else:
                print(f"[{self.camera_id}] Backend returned unexpected status: {response.status_code}")

        except requests.exceptions.ConnectionError:
            print(f"[{self.camera_id}] Cannot connect to NestJS backend at {BACKEND_URL}")

        except requests.exceptions.Timeout:
            print(f"[{self.camera_id}] Request to backend timed out after 5 seconds.")

        except Exception as error:
            print(f"[{self.camera_id}] Unexpected error sending detection: {error}")
