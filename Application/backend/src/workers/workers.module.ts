import { Module } from '@nestjs/common';
import { WorkerControlService } from './worker-control.service';

/**
 * WorkersModule exposes WorkerControlService so other modules
 * (CamerasModule) can inject it without circular dependencies.
 */
@Module({
  providers: [WorkerControlService],
  exports: [WorkerControlService],
})
export class WorkersModule {}
