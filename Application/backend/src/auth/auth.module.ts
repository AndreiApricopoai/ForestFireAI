import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

/**
 * AuthModule bundles everything needed for authentication:
 *   - AuthController: HTTP routes
 *   - AuthService: business logic
 *   - JwtStrategy: token validation for protected routes
 *   - JwtModule: token signing and verification
 *   - PassportModule: Passport.js integration (required for @UseGuards(JwtAuthGuard))
 *   - UsersModule: needed by AuthService and JwtStrategy to look up users
 */
@Module({
  imports: [
    UsersModule,

    PassportModule,

    // JwtModule.registerAsync reads the secret from config instead of hardcoding it
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d', // Tokens expire after 7 days
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
