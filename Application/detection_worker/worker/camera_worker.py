"""
camera_worker.py

One CameraWorker instance handles one camera/video source.
It runs inside its own Python thread, reads frames from the video,
runs YOLO every N seconds, saves the annotated snapshot, and
POSTs the detection result to the NestJS backend.
"""

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
    """
    Represents a single camera processing thread.

    Lifecycle:
        1. Create the worker with camera info and a shared detector
        2. Call start() — this spawns a new thread
        3. The thread loops: read frame -> run YOLO -> save snapshot -> POST to NestJS
        4. Call stop() to signal the thread to exit cleanly
    """

    def __init__(self, camera_id, camera_name, source_url, detector,
                 analysis_interval=None, confidence_threshold=None):
        """
        Parameters:
            camera_id            - unique ID of the camera from MongoDB
            camera_name          - human-readable name (used for logging)
            source_url           - filename of the video inside the cameras/ folder
            detector             - shared FireDetector instance (loaded once, shared across threads)
            analysis_interval    - seconds between each YOLO run (overrides global default)
            confidence_threshold - minimum confidence for detections (overrides global default)
        """
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.source_url = source_url
        self.detector = detector

        # Use per-camera settings if provided, otherwise fall back to global config
        if analysis_interval is not None:
            self.analysis_interval = analysis_interval
        else:
            self.analysis_interval = ANALYSIS_INTERVAL_SECONDS

        if confidence_threshold is not None:
            self.confidence_threshold = confidence_threshold
        else:
            self.confidence_threshold = CONFIDENCE_THRESHOLD

        # threading.Event is used to signal the thread to stop
        # When set() is called, the thread will exit its loop on next check
        self._stop_event = threading.Event()

        # The actual Thread object — created fresh each time start() is called
        self._thread = None

        # Public status fields so the manager can report state
        self.status = "stopped"
        self.error_message = None

    def start(self):
        """
        Spawn a new thread and begin processing the video.
        Does nothing if the thread is already running.
        """
        if self._thread is not None and self._thread.is_alive():
            print(f"[{self.camera_id}] Worker is already running, skipping start.")
            return

        # Clear any previous stop signal before starting
        self._stop_event.clear()
        self.status = "running"
        self.error_message = None

        # Create the thread — daemon=True means it exits automatically when main process exits
        self._thread = threading.Thread(
            target=self._run,
            name=f"worker-{self.camera_id}",
            daemon=True
        )

        self._thread.start()
        print(f"[{self.camera_id}] Worker thread started for: {self.camera_name}")

    def stop(self):
        """
        Signal the thread to stop and wait for it to finish.
        The thread checks _stop_event on every loop iteration.
        """
        if self._thread is None or not self._thread.is_alive():
            print(f"[{self.camera_id}] Worker is not running, nothing to stop.")
            return

        print(f"[{self.camera_id}] Sending stop signal to worker...")

        # Set the event — the thread will see this and exit its loop
        self._stop_event.set()

        # Wait up to 10 seconds for the thread to finish cleanly
        self._thread.join(timeout=10)

        self.status = "stopped"
        print(f"[{self.camera_id}] Worker stopped.")

    def is_running(self):
        """Return True if the thread is alive and processing."""
        return self._thread is not None and self._thread.is_alive()

    def _run(self):
        """
        The main processing loop — this runs inside the thread.

        Strategy: instead of reading every single frame and counting, we jump
        directly to the target frame using cap.set(). Between analyses we sleep
        for analysis_interval seconds using _stop_event.wait() so the thread
        wakes up immediately if stop() is called mid-sleep.

        Steps:
            1. Open the video
            2. Read video properties (fps, total frames)
            3. Jump to the current target frame → run YOLO → save → POST
            4. Advance target frame by (fps * interval) positions
            5. If target is past the end, loop back to frame 0
            6. Sleep for analysis_interval seconds, then repeat
        """

        # Build the full path to the video file
        video_path = os.path.join(CAMERAS_FOLDER, self.source_url)

        # Check the file exists before trying to open it
        if not os.path.exists(video_path):
            print(f"[{self.camera_id}] ERROR: Video file not found at: {video_path}")
            self.status = "error"
            self.error_message = f"Video file not found: {video_path}"
            return

        # Open the video with OpenCV
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            print(f"[{self.camera_id}] ERROR: Could not open video: {video_path}")
            self.status = "error"
            self.error_message = "Could not open video file"
            return

        print(f"[{self.camera_id}] Video opened: {video_path}")

        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 25.0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # How many frames to advance per interval
        # e.g. 25 fps * 5 seconds = 125 frames between each YOLO run
        frames_per_interval = int(fps * self.analysis_interval)
        if frames_per_interval <= 0:
            frames_per_interval = 1

        # Start at the beginning
        current_frame_index = 0

        # Main processing loop — runs until stop() is called
        while not self._stop_event.is_set():

            # Jump directly to the target frame position — no need to read every frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame_index)
            ret, frame = cap.read()

            if not ret:
                # Frame read failed (end of file or corrupt frame) — loop back
                print(f"[{self.camera_id}] Could not read frame {current_frame_index}, looping back to start.")
                current_frame_index = 0
                continue

            # The actual video timestamp for this frame (in milliseconds)
            video_timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))

            print(f"[{self.camera_id}] Analyzing frame at {video_timestamp_ms}ms (frame {current_frame_index}/{total_frames})")

            try:
                # Run YOLO on this frame
                annotated_frame, detections = self.detector.analyze_frame(
                    frame=frame,
                    confidence_threshold=self.confidence_threshold
                )

                # Save the annotated frame — always same filename, overwriting previous
                self._save_snapshot(annotated_frame)

                # Build the payload and send to NestJS
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

            # Advance to the next target frame
            current_frame_index = current_frame_index + frames_per_interval

            # If we've passed the end of the video, loop back to the beginning
            if current_frame_index >= total_frames:
                print(f"[{self.camera_id}] End of video reached, looping back to start.")
                current_frame_index = 0

            # Sleep for the real analysis interval before processing the next frame.
            # Using _stop_event.wait() instead of time.sleep() means stop() will
            # wake this thread up immediately instead of waiting out the full sleep.
            self._stop_event.wait(timeout=self.analysis_interval)

        # Loop exited — clean up the video capture
        cap.release()
        print(f"[{self.camera_id}] Video capture released. Thread exiting.")

    def _save_snapshot(self, annotated_frame):
        """
        Save the annotated frame as a JPEG file.
        Always overwrites the same file so only the latest frame is kept on disk.
        """
        # Make sure the snapshots folder exists (create it if not)
        os.makedirs(SNAPSHOTS_FOLDER, exist_ok=True)

        # The filename is always the same for this camera — overwrites previous
        snapshot_filename = f"{self.camera_id}_latest.jpg"
        snapshot_path = os.path.join(SNAPSHOTS_FOLDER, snapshot_filename)

        # Write the image to disk
        success = cv2.imwrite(snapshot_path, annotated_frame)

        if success:
            print(f"[{self.camera_id}] Snapshot saved: {snapshot_path}")
        else:
            print(f"[{self.camera_id}] WARNING: Failed to save snapshot to: {snapshot_path}")

    def _send_detection(self, payload):
        """
        Send the detection result to the NestJS backend via HTTP POST.
        Every request carries the shared WORKER_TOKEN so NestJS can verify
        that only the authorised worker service can write detection data.
        If NestJS is not reachable, we log the error and continue — we do not crash.
        """
        url = f"{BACKEND_URL}/detections"

        # Attach the shared secret in the Authorization header.
        # NestJS WorkerAuthGuard compares this against its own WORKER_TOKEN env var.
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
