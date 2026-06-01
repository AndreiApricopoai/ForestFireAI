import { Module } from '@nestjs/common';
import { DetectionsService } from './detections.service';
import { DetectionsController } from './detections.controller';
import { CamerasModule } from '../cameras/cameras.module';
import { EventsModule } from '../websocket/events.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [CamerasModule, EventsModule, AlertsModule],
  controllers: [DetectionsController],
  providers: [DetectionsService],
})
export class DetectionsModule {}
