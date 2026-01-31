import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from '../../config/logger.config';

/**
 * Common Logger Module
 * Provides centralized logging via Winston
 * Exports as global module for use across the application
 */

@Module({
  providers: [
    {
      provide: 'LOGGER',
      useValue: WinstonModule.createLogger({
        instance: winstonLogger,
      }),
    },
  ],
  exports: ['LOGGER'],
})
export class LoggerModule {}
