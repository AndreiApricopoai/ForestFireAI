import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * EventsGateway is the Socket.IO server layer.
 *
 * It runs alongside the HTTP server on the same port.
 * Clients (React frontend) connect via socket.io-client and join rooms
 * for the specific cameras they are currently watching.
 *
 * Room naming convention:  "camera:<cameraId>"
 * Example:                 "camera:683abc123def456789012345"
 *
 * Flow:
 *  1. Frontend connects → sends 'subscribe' with an array of camera IDs
 *  2. Gateway puts the socket into those rooms
 *  3. Python worker POSTs a detection → NestJS calls emitDetectionToRoom()
 *  4. The event is sent ONLY to clients in that camera's room
 *  5. If the user navigates away, frontend sends 'unsubscribe'
 */
@WebSocketGateway({
  // Allow any localhost origin during development
  cors: {
    origin: /^http:\/\/localhost(:\d+)?$/,
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  /**
   * @WebSocketServer() injects the raw Socket.IO Server instance.
   * Used to emit events to rooms from outside the gateway (e.g. DetectionsService).
   */
  @WebSocketServer()
  server: Server;

  /**
   * Called automatically when a client connects.
   */
  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  /**
   * Called automatically when a client disconnects.
   * Socket.IO automatically removes the client from all rooms on disconnect.
   */
  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  /**
   * Frontend sends:  socket.emit('subscribe', ['id1', 'id2', 'id3'])
   *
   * The client joins a room for each camera ID.
   * After this, any event emitted to "camera:<id>" will reach this client.
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() cameraIds: string[],
  ) {
    if (!Array.isArray(cameraIds)) {
      return;
    }

    for (const cameraId of cameraIds) {
      const roomName = `camera:${cameraId}`;
      void client.join(roomName);
      console.log(`[WebSocket] ${client.id} joined room: ${roomName}`);
    }
  }

  /**
   * Frontend sends:  socket.emit('unsubscribe', ['id1'])
   *
   * The client leaves those rooms — stops receiving events for those cameras.
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() cameraIds: string[],
  ) {
    if (!Array.isArray(cameraIds)) {
      return;
    }

    for (const cameraId of cameraIds) {
      const roomName = `camera:${cameraId}`;
      void client.leave(roomName);
      console.log(`[WebSocket] ${client.id} left room: ${roomName}`);
    }
  }

  /**
   * Called by DetectionsService after processing a detection from Python.
   *
   * Emits a 'detection:new' event to ALL clients currently in that camera's room.
   * Clients not subscribed to this camera will not receive anything.
   *
   * Payload sent to frontend:
   * {
   *   cameraId:        string
   *   timestamp:       string (ISO 8601)
   *   snapshotUrl:     string  (e.g. "/snapshots/<cameraId>_latest.jpg")
   *   detections:      Array<{ class, confidence, bbox }>
   *   riskLevel:       'none' | 'low' | 'medium' | 'high' | 'critical'
   *   videoTimestampMs: number
   * }
   */
  emitDetectionToRoom(
    cameraId: string,
    payload: {
      cameraId: string;
      timestamp: string;
      snapshotUrl: string;
      detections: Array<{ class: string; confidence: number; bbox: number[] }>;
      riskLevel: string;
      videoTimestampMs: number;
    },
  ) {
    const roomName = `camera:${cameraId}`;
    this.server.to(roomName).emit('detection:new', payload);
  }

  /**
   * Frontend sends:  socket.emit('subscribeAlerts')
   *
   * Puts the socket into the special "admins" room.
   * Only clients in this room will receive 'alert:new' events.
   * The frontend calls this when it determines the user is an admin.
   */
  @SubscribeMessage('subscribeAlerts')
  handleSubscribeAlerts(@ConnectedSocket() client: Socket) {
    void client.join('admins');
    console.log(`[WebSocket] ${client.id} joined room: admins`);
  }

  /**
   * Called by AlertsService after a new Alert document is persisted.
   *
   * Emits 'alert:new' exclusively to clients in the "admins" room.
   * Regular user clients that haven't called subscribeAlerts receive nothing.
   *
   * Payload mirrors the AlertRecord interface on the frontend.
   */
  emitNewAlert(payload: {
    id: string;
    cameraId: string;
    detectionTimestamp: string;
    type: string;
    maxConfidence: number;
    riskLevel: string;
    alertSnapshotUrl: string;
    status: string;
    createdAt: string;
  }) {
    this.server.to('admins').emit('alert:new', payload);
    console.log(
      `[WebSocket] alert:new emitted to admins — camera: ${payload.cameraId}, type: ${payload.type}`,
    );
  }

  /**
   * Emit a generic event to all connected clients (broadcast).
   * Used for system-wide notifications (e.g. a camera went offline).
   */
  emitToAll(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }
}
