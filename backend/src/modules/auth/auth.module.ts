import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { OAuthAccount } from '../users/entities/oauth-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { jwtConfig } from '../../config/auth.config';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { TwoFactorModule } from '../two-factor/two-factor.module';
import { AuthorizationGuard } from './guards/authorization.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, OAuthAccount, Subscription, AuditLog]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = jwtConfig(configService);
        return {
          secret: config.secret,
          signOptions: {
            expiresIn: config.accessTokenExpiry,
            issuer: config.issuer,
            audience: config.audience,
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuditModule,
    TwoFactorModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuthorizationGuard,
    {
      provide: GoogleStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
        if (!clientId) return null;
        return new GoogleStrategy(configService, authService);
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: LinkedInStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const clientId = configService.get<string>('LINKEDIN_CLIENT_ID');
        if (!clientId) return null;
        return new LinkedInStrategy(configService, authService);
      },
      inject: [ConfigService, AuthService],
    },
  ].filter(Boolean),
  exports: [AuthService, JwtStrategy, PassportModule, AuthorizationGuard],
})
export class AuthModule {}
