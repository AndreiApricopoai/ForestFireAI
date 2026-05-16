import { Controller, Get } from '@nestjs/common';

/**
 * HealthController exposes a simple GET /health endpoint.
 *
 * Used by:
 *   - The Python detection worker on startup to verify NestJS is reachable
 *   - Any monitoring tools or load balancers in the future
 *
 * No auth required — it must be publicly accessible.
 */
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
