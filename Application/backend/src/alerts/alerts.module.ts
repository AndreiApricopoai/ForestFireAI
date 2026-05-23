import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { EventsModule } from '../websocket/events.module';

/**
 * AlertsModule wires the Alert schema, AlertsService, and AlertsController.
 *
 * EventsModule is imported so AlertsService can inject EventsGateway and
 * push 'alert:new' WebSocket events to connected admin clients.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
    EventsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
