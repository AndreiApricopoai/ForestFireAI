import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Camera, CameraSchema } from './schemas/camera.schema';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';
import { WorkersModule } from '../workers/workers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Camera.name, schema: CameraSchema }]),
    WorkersModule,
  ],
  controllers: [CamerasController],
  providers: [CamerasService],
  exports: [CamerasService],
})
export class CamerasModule {}
