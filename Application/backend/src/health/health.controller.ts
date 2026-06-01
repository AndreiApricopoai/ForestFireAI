import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'ForestFire AI Backend',
      timestamp: new Date().toISOString(),
    };
  }
}
