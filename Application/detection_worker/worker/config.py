"""
config.py

Reads all configuration values from the .env file and environment variables.
Every other file imports from here — never read os.getenv() directly in other files.
"""

import os
from dotenv import load_dotenv

# Load the .env file from the current directory
load_dotenv()


# -----------------------------------------------------------------------
# Model
# -----------------------------------------------------------------------

# Full path to the YOLO model weights file (your best.pt)
MODEL_PATH = os.getenv("MODEL_PATH", "best.pt")


# -----------------------------------------------------------------------
# Folders
# -----------------------------------------------------------------------

# Path to the folder that contains the camera video files
# Both NestJS and Python share this folder
CAMERAS_FOLDER = os.getenv("CAMERAS_FOLDER", "../cameras")

# Path to the folder where annotated snapshot images will be saved
# NestJS will serve this folder as static files so the frontend can load images
SNAPSHOTS_FOLDER = os.getenv("SNAPSHOTS_FOLDER", "../snapshots")


# -----------------------------------------------------------------------
# NestJS Backend
# -----------------------------------------------------------------------

# Base URL of the NestJS backend
# Python will POST detections here and also fetch the camera list on startup
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")


# -----------------------------------------------------------------------
# Detection settings (used as defaults — can be overridden per camera)
# -----------------------------------------------------------------------

# How many seconds to wait between each YOLO analysis per camera
ANALYSIS_INTERVAL_SECONDS = int(os.getenv("ANALYSIS_INTERVAL_SECONDS", "5"))

# Minimum confidence score for a detection to be included in results
# Value between 0.0 and 1.0
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))

# IOU threshold for non-maximum suppression (removes duplicate boxes)
IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", "0.45"))


# -----------------------------------------------------------------------
# This service
# -----------------------------------------------------------------------

# Port that this FastAPI service will listen on
# NestJS will call this service on this port to start/stop workers
SERVICE_PORT = int(os.getenv("SERVICE_PORT", "8000"))
