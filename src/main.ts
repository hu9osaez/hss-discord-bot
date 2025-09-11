import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Bootstrap');
  logger.log('Discord Bot is running');
}
bootstrap();
