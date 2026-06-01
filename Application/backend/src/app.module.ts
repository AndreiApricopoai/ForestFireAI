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

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),

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

  controllers: [HealthController],
})
export class AppModule {}
