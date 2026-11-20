import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so your React application can communicate with this API
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('PCSO Lotto API')
    .setDescription(
      'API for retrieving PCSO lotto draws, syncing results, and analyzing historical statistics.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
  });

  // Automatically save the raw JSON schema file to the project root for your Cursor AI Agent
  const outputPath = path.resolve(process.cwd(), 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf8');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
