# Cursor Project Context — Forest Fire Monitoring Platform

## Purpose

This file provides Cursor AI with complete project context for the dissertation platform.

The project is a modular real-time forest fire monitoring system using YOLOv8 smoke/fire detection.

---

# Project Overview

The application is a web-based monitoring platform that receives video feeds from drones or static cameras, processes sampled frames using a YOLOv8 model, and displays detection results and alerts on a dashboard.

For the proof of concept:

- Real cameras/drones are simulated using local videos
- YOLOv8 processes one frame every few seconds
- Dashboard displays latest analyzed snapshots instead of full real-time AI overlays
- Full video playback is available separately

The architecture must be modular and scalable.

---

# Main Technologies

## Frontend

- React
- TypeScript
- Vite
- CSS Modules (plain CSS, no Tailwind)
- [Socket.IO](http://Socket.IO) client
- Axios
- React Router

## Backend

- Node.js
- NestJS
- MongoDB
- Mongoose
- [Socket.IO](http://Socket.IO) / WebSockets

## AI Processing Service

- Python
- OpenCV
- Ultralytics YOLOv8
- Requests
- python-dotenv
- boto3 later for AWS S3

## Database

- MongoDB local first
- MongoDB Atlas optional later

## AWS Later

- S3 for video/snapshot storage
- EC2 for Python processing service

---

# System Architecture

```text
[Local Videos / S3 Videos / Future RTSP Cameras / Drones]
                         |
                         v
              [Python Processing Service]
              - reads camera sources
              - samples 1 frame every 3–5 sec
              - runs YOLOv8 detection
              - creates annotated snapshots
              - sends results to backend
                         |
                         v
                 [NestJS Backend API]
                 - camera registry
                 - detection storage
                 - alert logic
                 - WebSocket updates
                         |
                         v
                    [MongoDB]
                         |
                         v
                  [React Dashboard]

```

---

# Key Functional Requirements

## Camera Management

Admin can:

- Add camera/drone
- Edit source
- Remove source
- Enable/disable source

Supported source types:

- local_video
- s3_video
- rtsp (future)
- drone_stream (future)

---

# Detection Logic

The system DOES NOT process every frame.

Instead:

- Videos are played normally
- YOLO analyzes one frame every 3–5 seconds
- The latest annotated frame is displayed on the dashboard

Recommended defaults:

```text
analysisIntervalSeconds = 5
confidenceThreshold = 0.45

```

---

# Dashboard Design

Main dashboard contains:

- Camera cards
- Latest annotated frame
- Detection confidence
- Risk level
- Camera status
- Detection timestamp

When clicking a camera:

## Detection Tab

Shows:

- Latest analyzed frame
- Bounding boxes
- Detection classes
- Confidence values
- Alert status

## Video Tab

Shows:

- Original video playback
- Starts playback from latest detection timestamp

---

# Python Processing Service Design

The Python processor:

1. Fetches active cameras from backend
2. Starts one worker per source
3. Reads frames from video source
4. Every N seconds:
  - Runs YOLO inference
  - Creates annotated image
  - Sends detection metadata to backend
5. Repeats continuously

One worker = one source.

The architecture should support scaling to multiple inference containers later.

---

# Backend Responsibilities

NestJS backend handles:

- Camera registry
- Detection storage
- Alert logic
- WebSocket updates
- Snapshot metadata
- Detection history

Suggested modules:

```text
src/
  cameras/
  detections/
  alerts/
  websocket/

```

---

# Detection Payload Example

```json
{
  "cameraId": "drone_001",
  "timestamp": "2026-05-13T15:10:00Z",
  "videoTimestampMs": 35000,
  "snapshotUrl": "/snapshots/drone_001_35000.jpg",
  "detections": [
    {
      "class": "fire",
      "confidence": 0.72,
      "bbox": [120, 80, 340, 260]
    }
  ]
}

```

---

# Alert Logic

Example rule:

```text
If fire confidence > 0.60
OR smoke confidence > 0.70
AND appears in 2 consecutive analyzed frames
THEN create alert

```

---

# Scalability Direction

Current prototype:

```text
1 Python processing service
Multiple camera workers
Local videos
Local backend

```

Future scalable architecture:

```text
Multiple inference containers
Distributed workers
Queue-based processing
GPU servers
RTSP support
Cloud deployment

```

---

# Development Priorities

Build in this order:

1. Backend API
2. MongoDB schemas
3. Camera CRUD
4. React dashboard layout
5. Python processor
6. YOLO integration
7. Snapshot upload/display
8. WebSocket updates
9. Alerts
10. Video replay tab

---

# Important Design Decisions

## DO

- Keep AI processing separate from backend
- Use WebSockets for realtime updates
- Use modular architecture
- Keep source abstraction flexible
- Display analyzed snapshots instead of realtime overlay
- Develop locally first

## DO NOT

- Run YOLO inside Node.js
- Process every frame with AI
- Couple frontend directly to Python service
- Hardcode video source types

---

# Folder Structure

```text
forest-fire-platform/

  frontend/
  backend/
  processor/
  snapshots/

```

Processor structure:

```text
processor/
  processor.py
  detector.py
  camera_worker.py
  config.py
  requirements.txt
  .env
  best.pt
  videos/

```

---

# Coding Expectations For Cursor

When generating code:

- Prefer modular architecture
- Use TypeScript in frontend/backend
- Use async/await
- Use clean service-based design
- Avoid overengineering
- Prioritize maintainability
- Use environment variables for configuration
- Keep AWS integration optional and abstracted

---

# Final Goal

Create a functional proof-of-concept platform capable of:

- Simulating multiple drone/camera feeds
- Running YOLOv8 fire/smoke detection
- Displaying detections in realtime dashboard cards
- Generating alerts
- Supporting future real camera integration
- Demonstrating scalable architecture suitable for dissertation presentation

