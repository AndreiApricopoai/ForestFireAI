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

@WebSocketGateway({

  cors: {
    origin: /^http:\/\/localhost(:\d+)?$/,
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

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

  @SubscribeMessage('subscribeAlerts')
  handleSubscribeAlerts(@ConnectedSocket() client: Socket) {
    void client.join('admins');
    console.log(`[WebSocket] ${client.id} joined room: admins`);
  }

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

  emitToAll(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }
}
