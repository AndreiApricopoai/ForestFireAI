"""
detector.py

Wraps the YOLO model so the rest of the code does not need to
know anything about the Ultralytics API directly.

One FireDetector instance is created at startup and shared
across all camera worker threads. YOLO inference is safe to
call from multiple threads simultaneously.
"""

from ultralytics import YOLO
from config import MODEL_PATH, IOU_THRESHOLD


class FireDetector:
    """
    Loads the YOLO model and exposes a single method to analyze a frame.
    """

    def __init__(self):
        """
        Load the YOLO model from the path defined in config.
        This happens once when the WorkerManager is created.
        Loading a model is expensive so we only do it once.
        """
        print(f"[Detector] Loading YOLO model from: {MODEL_PATH}")
        self.model = YOLO(MODEL_PATH)
        print("[Detector] Model loaded successfully.")

    def analyze_frame(self, frame, confidence_threshold):
        """
        Run YOLO inference on a single image frame.

        Parameters:
            frame               - a raw OpenCV image (numpy array, BGR format)
            confidence_threshold - minimum confidence to include a detection (0.0 to 1.0)

        Returns:
            annotated_frame     - the same frame with bounding boxes drawn on it
            detections          - a list of dicts, one per detected object:
                                  [{ "class": "fire", "confidence": 0.82, "bbox": [x1, y1, x2, y2] }]
        """

        # Run inference — verbose=False suppresses the console output per frame
        results = self.model.predict(
            source=frame,
            conf=confidence_threshold,
            iou=IOU_THRESHOLD,
            verbose=False
        )

        # results is always a list, we only passed one frame so we take index 0
        result = results[0]

        # Draw bounding boxes and labels directly onto the frame
        annotated_frame = result.plot()

        # Build a clean list of detections from the raw YOLO result
        detections = []

        for box in result.boxes:
            # Get the class index and look up the class name (e.g. "fire" or "smoke")
            class_index = int(box.cls[0])
            class_name = result.names[class_index]

            # Confidence is a float between 0.0 and 1.0
            confidence = float(box.conf[0])

            # Bounding box coordinates: [x1, y1, x2, y2] in pixels
            raw_bbox = box.xyxy[0].tolist()
            bbox = [int(coordinate) for coordinate in raw_bbox]

            detection = {
                "class": class_name,
                "confidence": round(confidence, 4),
                "bbox": bbox
            }

            detections.append(detection)

        return annotated_frame, detections
