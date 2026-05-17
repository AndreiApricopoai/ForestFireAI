import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertsService } from './alerts.service';

/**
 * AlertsModule registers the Alert Mongoose model and the AlertsService.
 * The service is exported so DetectionsModule can inject it.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
  ],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
