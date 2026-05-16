import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Backend running on: http://localhost:${port}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
}

bootstrap();
