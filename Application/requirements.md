For local developemnt, no deployment or aws services for now:

- Will have multiple videos in folder called cameras, videos pasted by me manually from the internet
- Both nest backend and python detector worker will have acces to these videos/ simulated drones-cameras
- the python procesor should be able to process multiple drones simultaneously using real threads
- for the admin user, the frontend should have a special panel where the admin can send reauests to the backend
    in order to stop processing certain cameras or re-add them for processing basically calling an endpopint to the nest backend
    then nest will call an ednpoint and somehow comunicate to the python worker to stop processing or restart processing drones
- should find a way where the nest backend will store the latest prediction frame with the drawn boxes and all the connected users to the frontendapp should
    be able to receive the latest prections for the drones they are watching in their dashboard (propose some solutions for this in an effiecnt way)

---

CAMERAS:

- Cameras collection in MongoDB. Each camera document contains:
    id, name, location, region, sourceType (local_video / s3_video / rtsp),
    sourceUrl (filename inside cameras/ folder), isActive, status (active/inactive/error),
    analysisIntervalSeconds, confidenceThreshold,
    latestDetection (embedded object, overwritten each cycle — no history):
        { timestamp, snapshotUrl, detections: [{ class, confidence, bbox }], riskLevel }
    createdAt, updatedAt

- Python worker fetches only active cameras (isActive: true) from NestJS on startup
- For each active camera, Python spawns one thread that loops every N seconds:
    1. Read frame from video
    2. Run YOLO
    3. Save annotated image to snapshots/{cameraId}_latest.jpg  (always overwrite same file)
    4. POST detection payload to NestJS POST /detections

---

REAL-TIME DETECTION FLOW (Worker → NestJS → Frontend):

- Python saves annotated snapshot to disk: snapshots/{cameraId}_latest.jpg (overwrites)
- Python POSTs detection payload to NestJS: { cameraId, timestamp, snapshotUrl, detections, riskLevel }
- NestJS on receiving detection:
    1. Updates camera.latestDetection in MongoDB (embedded field, single document update)
    2. Emits Socket.IO event "detection:new" to room "camera:{cameraId}" only
       Payload: { cameraId, snapshotUrl, detections, riskLevel, timestamp }
- NestJS serves the snapshots/ folder as static files
- Frontend loads snapshot image directly: GET http://localhost:3000/snapshots/{cameraId}_latest.jpg

---

WEBSOCKET / ROOMS ARCHITECTURE:

- Each camera has its own Socket.IO room named "camera:{cameraId}"
- On dashboard load, frontend connects to Socket.IO and emits "subscribe" with the list of
  cameraIds currently visible on screen
- NestJS joins that socket to the corresponding rooms
- Frontend listens for "detection:new" events and updates only the relevant camera card
- When the user changes filter (e.g. filter by region), frontend emits:
    "unsubscribe" with old cameraIds
    "subscribe" with new cameraIds
- NestJS leaves the old rooms and joins the new ones for that socket
- On disconnect / page close, Socket.IO automatically removes the socket from all rooms

Why rooms and not broadcast:
- Broadcast sends every detection to every connected user regardless of what they are watching
- Rooms ensure each user only receives events for cameras they are currently viewing
- Zero unnecessary traffic — if no one is watching a camera, its room is empty and the emit costs nothing

---

AUTH & USERS:

- Login with email and password — frontend validation required (email format, password min 8 chars)
- Register with name, email, password and confirm password — frontend validation required
- Frontend validation must be mirrored on the backend (same rules enforced server-side)
- 3 roles: user, admin, worker
- On register: save user to MongoDB, hash password, generate JWT, return token + user to frontend
- On login: verify credentials, generate JWT, return token + user to frontend. Show error if invalid
- JWT token stored in localStorage on frontend, sent as Authorization header on every request
- After successful login or register, redirect to dashboard
- NestJS backend must expose a GET /health endpoint returning server status
- Python worker must call GET /health on startup — if backend is not reachable, log error and abort

    
