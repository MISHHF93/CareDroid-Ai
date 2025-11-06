import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TwoFactorModule } from './modules/two-factor/two-factor.module';
import { AiModule } from './modules/ai/ai.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { AuditModule } from './modules/audit/audit.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database (load after ConfigModule so .env is available)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const client = (process.env.DATABASE_CLIENT || '').toLowerCase();
        if (client === 'sqlite') {
          return {
            type: 'sqlite',
            database: process.env.SQLITE_PATH || 'caredroid.dev.sqlite',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          };
        }
        return databaseConfig;
      },
    }),

    // Rate limiting (100 requests per 15 minutes)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute in milliseconds
        limit: 100,
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    TwoFactorModule,
    AiModule,
    ClinicalModule,
    AuditModule,
    ComplianceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
