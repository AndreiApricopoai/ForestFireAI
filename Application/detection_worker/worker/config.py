import os
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "best.pt")

CAMERAS_FOLDER = os.getenv("CAMERAS_FOLDER", "../cameras")

SNAPSHOTS_FOLDER = os.getenv("SNAPSHOTS_FOLDER", "../snapshots")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")

ANALYSIS_INTERVAL_SECONDS = int(os.getenv("ANALYSIS_INTERVAL_SECONDS", "5"))

CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))

IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", "0.45"))

WORKER_TOKEN = os.getenv("WORKER_TOKEN", "")

SERVICE_PORT = int(os.getenv("SERVICE_PORT", "8000"))
