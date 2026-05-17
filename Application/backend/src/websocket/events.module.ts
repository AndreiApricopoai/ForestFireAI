import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

/**
 * EventsModule bundles the Socket.IO gateway.
 * It is exported so other modules (DetectionsModule) can inject EventsGateway.
 */
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
