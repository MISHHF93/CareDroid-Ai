import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import loggerConfig from '../../config/logger.config';

/**
 * Common Logger Module
 * Provides centralized logging via Winston
 * Exports as global module for use across the application
 */

@Module({
  providers: [
    {
      provide: 'LOGGER',
      useFactory: (configService: ConfigService) => {
        const config = configService.get<any>('logger');
        return config?.createLogger ? config.createLogger() : loggerConfig().createLogger();
      },
      inject: [ConfigService],
    },
  ],
  exports: ['LOGGER'],
})
export class LoggerModule {}
