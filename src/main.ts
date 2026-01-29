import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter 
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Trip Planner API')
    .setDescription(
      'API for searching and managing trips. Search trips by origin and destination with sorting strategies (fastest/cheapest), and manage saved trips.',
    )
    .setVersion('1.0')
    .addTag('trips', 'Trip search operations')
    .addTag('saved-trips', 'Saved trips management')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/swagger', app, document);

  app.use('/api/docs/scalar', apiReference({
    spec: { content: document }
  }))
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs/swagger`);
  console.log(`Scalar docs available at: http://localhost:${port}/api/docs/scalar`);
}
bootstrap();
