import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JwtStrategy is a Passport strategy that validates incoming JWT tokens.
 *
 * When a request hits a protected route (decorated with @UseGuards(JwtAuthGuard)):
 *   1. JwtAuthGuard activates this strategy
 *   2. Passport extracts the token from the Authorization header
 *   3. Passport verifies the signature using JWT_SECRET
 *   4. If valid, the payload is passed to our validate() method
 *   5. Whatever validate() returns is attached to req.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Extract the token from the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Do not ignore expired tokens — return 401 if token has expired
      ignoreExpiration: false,

      // The secret used to verify the token signature (must match the one used to sign it)
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  /**
   * Called after the token is verified as valid.
   * We do a DB lookup to make sure the user still exists.
   * The returned object becomes req.user in all protected route handlers.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return user;
  }
}
