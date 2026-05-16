import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard protects routes that require the user to be logged in.
 *
 * Usage on a route:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('profile')
 *   getProfile(@Request() req) { return req.user; }
 *
 * Internally this activates the JwtStrategy, which validates the token
 * and populates req.user. If the token is missing or invalid, it returns HTTP 401.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
