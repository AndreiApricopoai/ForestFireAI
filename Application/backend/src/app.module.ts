import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';

/**
 * AppModule is the root module — it imports everything else.
 *
 * ConfigModule  — reads .env and makes values available via ConfigService
 * MongooseModule — connects to MongoDB using the URI from .env
 * AuthModule    — register + login endpoints
 * UsersModule   — user database operations
 * HealthController — GET /health (registered directly here, no separate module needed)
 */
@Module({
  imports: [
    // ConfigModule.forRoot makes @nestjs/config available globally.
    // isGlobal: true means you don't need to import ConfigModule in every module.
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MongooseModule.forRootAsync reads MONGODB_URI from config and connects.
    // forRootAsync is used instead of forRoot so we can inject ConfigService.
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    AuthModule,
    UsersModule,
  ],

  // HealthController is simple enough to register directly on the root module
  controllers: [HealthController],
})
export class AppModule {}
