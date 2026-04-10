import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { parseEnv } from '@vibedistro/config';
import { apiEnvSchema } from '@vibedistro/config/api';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const env = parseEnv(apiEnvSchema);

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env['WEB_URL'] ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API versioning prefix
  app.setGlobalPrefix('api/v1');

  // Swagger (dev/staging only)
  if (env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VibeDistro API')
      .setDescription('Music distribution platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth')
      .addTag('tenants')
      .addTag('users')
      .addTag('artists')
      .addTag('releases')
      .addTag('tracks')
      .addTag('assets')
      .addTag('royalties')
      .addTag('analytics')
      .addTag('tickets')
      .addTag('webhooks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`Swagger docs: http://localhost:${env.PORT}/api/docs`);
  }

  await app.listen(env.PORT);
  logger.log(`API running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.log(`Provider: revelator/${env.REVELATOR_ENVIRONMENT}, enabled=${env.REVELATOR_ENABLED}`);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
