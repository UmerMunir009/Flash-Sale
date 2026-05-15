import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import Redis from 'ioredis';


async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  });

  redis.on('connect', () => {
    logger.log('🔴 Redis connected successfully');
  });

  redis.on('error', (err) => {
    logger.error(`Redis connection failed: ${err.message}`);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Server running on http://localhost:${port}/api/v1`);
  logger.log(`🐘 PostgreSQL connected on port ${process.env.DB_PORT}`);
  logger.log(`📦 Database: ${process.env.DB_NAME}`);
}
void bootstrap();
