import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Camera, CameraSchema } from './schemas/camera.schema';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Camera.name, schema: CameraSchema }]),
  ],
  controllers: [CamerasController],
  providers: [CamerasService],
  // Export the service so DetectionsModule can inject it
  exports: [CamerasService],
})
export class CamerasModule {}
