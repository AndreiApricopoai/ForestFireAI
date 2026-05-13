Dissertation Project Blueprint
Project Title

Real-Time Forest Fire Monitoring Platform Using YOLOv8-Based Smoke and Fire Detection

Core Idea

Build a web platform that monitors forest areas using video feeds from drones or static cameras. The system detects smoke/fire using your trained YOLOv8 model and sends detection snapshots, alerts, and metadata to a dashboard.

For the proof of concept, real cameras/drones are simulated using local video files. Later, the same architecture can support S3 videos, RTSP streams, drones, or cloud video feeds.

Final Architecture
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
                    - cameras
                    - detections
                    - alerts
                    - users
                         |
                         v
                  [React Dashboard]
                  - camera cards
                  - latest detection image
                  - alert panel
                  - popup with detection/video tabs
Technologies
Frontend
React + TypeScript
Vite
Tailwind CSS
Socket.IO client
Axios
React Router

Optional later:

Leaflet / Mapbox for map view
Zustand or Redux for state management
Backend
Node.js
NestJS
MongoDB
Mongoose
Socket.IO / WebSockets
JWT authentication later
Python Processing Service
Python
OpenCV
Ultralytics YOLOv8
Requests
python-dotenv
boto3 later for AWS S3
Database
MongoDB local first
MongoDB Atlas later if needed
AWS Later
S3: store videos and snapshots
EC2: run Python YOLO processor
Optional: S3 public/presigned URLs for images
Main System Modules
1. Camera Registry

Admin can add/edit/remove cameras or drones.

Camera object example:

{
  "id": "drone_001",
  "name": "Drone 1",
  "type": "drone",
  "sourceType": "local_video",
  "sourceUrl": "./videos/drone1.mp4",
  "active": true,
  "analysisIntervalSeconds": 5,
  "confidenceThreshold": 0.45,
  "location": {
    "lat": 47.1585,
    "lng": 27.6014
  }
}

Later switch to S3:

{
  "sourceType": "s3_video",
  "sourceUrl": "s3://forest-fire-demo/videos/drone1.mp4"
}

Future real camera:

{
  "sourceType": "rtsp",
  "sourceUrl": "rtsp://user:password@camera-ip/stream"
}

This is your plug-and-play source design.

2. Python Processor

The Python service should:

1. Ask backend for active cameras
2. Start one worker per camera
3. Read frames from video source
4. Every 3–5 seconds, run YOLO detection
5. Draw bounding boxes on frame
6. Save/send annotated snapshot
7. POST metadata to backend
8. Repeat

For your prototype:

1 Python program
5–10 camera workers
local videos
local backend

Worker logic:

for each camera:
    open video
    every N seconds:
        extract frame
        run YOLO
        save annotated image
        send detection result to backend
3. Dashboard Design

Main dashboard:

Camera card 1
Camera card 2
Camera card 3
Camera card 4
Camera card 5

Each card shows:

latest analyzed frame
bounding boxes already drawn
camera name
last detection time
status: online/offline
risk level
highest confidence

When user clicks card:

Popup / modal
    Tab 1: Detection
        - latest annotated frame
        - detected classes
        - confidence values
        - timestamp
        - alert status

    Tab 2: Video
        - original video playback
        - starts from latest detection timestamp

This avoids difficult real-time box/video synchronization.

4. Detection Strategy

Do not run YOLO on every video frame.

Use:

Video display: normal playback
Detection: 1 frame every 3–5 seconds

Recommended default:

analysisIntervalSeconds = 5
confidenceThreshold = 0.45
alert rule = detection must appear in 2 consecutive analyzed frames

This means an alert triggers after around:

10 seconds

This is realistic and avoids false positives.

5. Alert Logic

Backend decides whether to create an alert.

Example rule:

If fire confidence > 0.60
OR smoke confidence > 0.70
AND appears in 2 consecutive analyzed frames
THEN create alert

Alert object:

{
  "cameraId": "drone_001",
  "type": "fire",
  "severity": "high",
  "confidence": 0.74,
  "timestamp": "2026-05-13T15:20:00Z",
  "snapshotUrl": "/snapshots/drone_001_123.jpg",
  "status": "new"
}
6. Backend API Endpoints

Minimum endpoints:

GET    /cameras
GET    /cameras/active
POST   /cameras
PATCH  /cameras/:id
DELETE /cameras/:id

POST   /detections
GET    /detections
GET    /detections/latest/:cameraId

GET    /alerts
PATCH  /alerts/:id/acknowledge

WebSocket events:

camera:update
detection:new
alert:new
7. Python to Backend Payload

Python sends:

{
  "cameraId": "drone_001",
  "timestamp": "2026-05-13T15:10:00Z",
  "videoTimestampMs": 35000,
  "snapshotUrl": "/snapshots/drone_001_35000.jpg",
  "frameWidth": 1920,
  "frameHeight": 1080,
  "detections": [
    {
      "class": "fire",
      "confidence": 0.72,
      "bbox": [120, 80, 340, 260]
    },
    {
      "class": "smoke",
      "confidence": 0.66,
      "bbox": [400, 100, 800, 500]
    }
  ]
}
8. Local Development Plan

Build in this order:

1. NestJS backend
2. MongoDB camera schema
3. Camera CRUD endpoints
4. React dashboard layout
5. Python processor reads local videos
6. Python runs YOLO every 5 seconds
7. Python saves annotated snapshots
8. Python sends detection metadata to backend
9. Backend stores latest detection
10. Backend emits WebSocket update
11. React displays latest snapshot in cards
12. Add popup with Detection tab and Video tab
13. Add alert logic
9. AWS Migration Plan

Start local first.

Then migrate gradually:

Step 1:
Local videos -> S3 videos

Step 2:
Local snapshots -> S3 snapshots

Step 3:
Local Python processor -> EC2 Python processor

Step 4:
Local backend stays local for demo
or later deploy backend too

AWS version:

S3 bucket:
    /videos
    /snapshots

EC2:
    processor.py
    best.pt
    .env
    requirements.txt

Local:
    React
    NestJS
    MongoDB
10. Folder Structure
forest-fire-platform/

  frontend/
    src/
      components/
      pages/
      services/
      store/
      App.tsx

  backend/
    src/
      cameras/
      detections/
      alerts/
      websocket/
      app.module.ts

  processor/
    processor.py
    detector.py
    camera_worker.py
    config.py
    requirements.txt
    .env
    best.pt
    videos/

  snapshots/
11. Dissertation Scalability Explanation

Use this wording:

The prototype uses a single Python processing service with multiple camera workers. Each worker is responsible for one video source and periodically samples frames for inference. This design is sufficient for a controlled proof of concept with several simulated drone or camera feeds.

For production deployment, the inference service can be horizontally scaled by running multiple processing containers. Each container receives a subset of active cameras. A scheduler or message queue can distribute video sources across available workers, allowing the system to scale beyond a single machine.
12. Key Dissertation Argument

Use this:

The platform separates video monitoring from AI inference. Instead of processing every video frame, the system periodically samples frames from each source, performs YOLOv8 inference, and publishes annotated detection snapshots to the dashboard. This reduces computational cost while still providing timely fire and smoke detection alerts.
13. What You Should Build First

First milestone:

Local React dashboard
Local NestJS backend
Local MongoDB
Python processor reading 3 local videos
YOLO detects every 5 seconds
Dashboard cards update with latest annotated frames