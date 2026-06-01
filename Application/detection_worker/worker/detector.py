import numpy
from ultralytics import YOLO
from config import MODEL_PATH, IOU_THRESHOLD

class FireDetector:

    def __init__(self):

        print(f"[Detector] Loading YOLO model from: {MODEL_PATH}")
        self.model = YOLO(MODEL_PATH)

        print("[Detector] Warming up model (running one dummy prediction)...")
        blank_frame = numpy.zeros((640, 640, 3), dtype=numpy.uint8)
        self.model.predict(source=blank_frame, conf=0.9, verbose=False)
        print("[Detector] Model warmed up and ready.")

    def analyze_frame(self, frame, confidence_threshold):

        results = self.model.predict(
            source=frame,
            conf=confidence_threshold,
            iou=IOU_THRESHOLD,
            verbose=False
        )

        result = results[0]

        annotated_frame = result.plot()

        detections = []

        for box in result.boxes:

            class_index = int(box.cls[0])
            class_name = result.names[class_index]

            confidence = float(box.conf[0])

            raw_bbox = box.xyxy[0].tolist()
            bbox = [int(coordinate) for coordinate in raw_bbox]

            detection = {
                "class": class_name,
                "confidence": round(confidence, 4),
                "bbox": bbox
            }

            detections.append(detection)

        return annotated_frame, detections
