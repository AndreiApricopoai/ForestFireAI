import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // NestExpressApplication gives us access to useStaticAssets()
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * ValidationPipe runs class-validator decorators on every incoming request body.
   *
   * whitelist: true
   *   Strips any properties from the request body that are NOT in the DTO.
   *   Prevents clients from injecting unexpected fields.
   *
   * forbidNonWhitelisted: true
   *   Instead of silently stripping extra fields, throw a 400 error.
   *   Makes the API strict — clients must send exactly what the DTO expects.
   *
   * transform: true
   *   Automatically converts incoming plain JSON objects into DTO class instances.
   *   This enables class-validator decorators to work correctly.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * CORS (Cross-Origin Resource Sharing) must be enabled so the React frontend
   * running on a different port can make requests to this backend.
   *
   * origin: the URL of the React dev server
   * credentials: true allows cookies and Authorization headers to be sent
   */
  app.enableCors({
    // Allow any localhost port during development (covers Vite using 5173, 5174, etc.)
    origin: /^http:\/\/localhost(:\d+)?$/,
    credentials: true,
  });

  /**
   * Serve the snapshots/ folder as static files under /snapshots.
   *
   * The Python worker saves annotated frames to:
   *   Application/snapshots/<cameraId>_latest.jpg
   *
   * NestJS serves them at:
   *   http://localhost:3000/snapshots/<cameraId>_latest.jpg
   *
   * __dirname in the compiled output is Application/backend/dist/
   * so ../../snapshots resolves to Application/snapshots/
   */
  const snapshotsFolder =
    process.env.SNAPSHOTS_FOLDER ?? join(__dirname, '..', '..', 'snapshots');

  app.useStaticAssets(snapshotsFolder, { prefix: '/snapshots' });

  /**
   * Serve the alerts snapshot folder under /alerts.
   * Alert images are separate from rolling snapshots.
   */
  const alertsFolder =
    process.env.ALERTS_FOLDER ?? join(__dirname, '..', '..', 'alerts');

  app.useStaticAssets(alertsFolder, { prefix: '/alerts' });

  /**
   * Serve the cameras/ folder under /cameras so the frontend can stream
   * the source video files directly in a <video> element for the live-feed tab.
   */
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
