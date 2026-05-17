import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CamerasModule } from './cameras/cameras.module';
import { DetectionsModule } from './detections/detections.module';
import { AlertsModule } from './alerts/alerts.module';
import { EventsModule } from './websocket/events.module';
import { HealthController } from './health/health.controller';

/**
 * AppModule is the root module — it imports everything else.
 *
 * ConfigModule     — reads .env and makes values available via ConfigService
 * MongooseModule   — connects to MongoDB using the URI from .env
 * AuthModule       — register + login endpoints
 * UsersModule      — user database operations
 * CamerasModule    — camera CRUD (GET /cameras, POST /cameras, etc.)
 * DetectionsModule — POST /detections (receives from Python worker)
 * AlertsModule     — alert schema + skeleton service
 * EventsModule     — Socket.IO gateway (subscribe/unsubscribe rooms)
 * HealthController — GET /health
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
    CamerasModule,
    DetectionsModule,
    AlertsModule,
    EventsModule,
  ],

  // HealthController is simple enough to register directly on the root module
  controllers: [HealthController],
})
export class AppModule {}
