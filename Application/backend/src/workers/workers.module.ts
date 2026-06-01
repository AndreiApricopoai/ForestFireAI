import { Module } from '@nestjs/common';
import { WorkerControlService } from './worker-control.service';

@Module({
  providers: [WorkerControlService],
  exports: [WorkerControlService],
})
export class WorkersModule {}
