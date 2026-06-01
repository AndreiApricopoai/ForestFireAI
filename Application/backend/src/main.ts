import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({

    origin: /^http:\/\/localhost(:\d+)?$/,
    credentials: true,
  });

  const snapshotsFolder =
    process.env.SNAPSHOTS_FOLDER ?? join(__dirname, '..', '..', 'snapshots');

  app.useStaticAssets(snapshotsFolder, { prefix: '/snapshots' });

  const alertsFolder =
    process.env.ALERTS_FOLDER ?? join(__dirname, '..', '..', 'alerts');

  app.useStaticAssets(alertsFolder, { prefix: '/alerts' });

  const camerasFolder =
    process.env.CAMERAS_FOLDER ?? join(__dirname, '..', '..', 'cameras');

  app.useStaticAssets(camerasFolder, { prefix: '/cameras' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Backend running on: http://localhost:${port}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
  console.log(`Snapshots served at:  http://localhost:${port}/snapshots`);
  console.log(`Alerts served at:     http://localhost:${port}/alerts`);
}

bootstrap();
