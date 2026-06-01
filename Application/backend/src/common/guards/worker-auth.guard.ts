import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * WorkerAuthGuard — protects endpoints that should only be called by the
 * Python detection worker.
 *
 * The worker sends every request with:
 *   Authorization: Bearer <WORKER_TOKEN>
 *
 * NestJS compares that value against the WORKER_TOKEN environment variable.
 * If they match, the request is allowed through. No JWT, no DB lookup.
 *
 * The token never changes at runtime — rotate it by updating both .env files
 * and restarting both services.
 */
@Injectable()
export class WorkerAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Worker token missing.');
    }

    const provided = authHeader.slice(7).trim(); // strip "Bearer "
    const expected = this.configService.get<string>('WORKER_TOKEN');

    if (!expected) {
      throw new UnauthorizedException('WORKER_TOKEN is not configured on the server.');
    }

    if (provided !== expected) {
      throw new UnauthorizedException('Invalid worker token.');
    }

    return true;
  }
}
