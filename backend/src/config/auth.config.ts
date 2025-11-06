import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET') || 'CHANGE_ME_IN_PRODUCTION',
  accessTokenExpiry: configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
  refreshTokenExpiry: configService.get<string>('JWT_REFRESH_EXPIRY') || '30d',
  issuer: 'caredroid-api',
  audience: 'caredroid-app',
});

export const oauthConfig = (configService: ConfigService) => ({
  google: {
    clientId: configService.get<string>('GOOGLE_CLIENT_ID'),
    clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
    callbackUrl: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/api/auth/google/callback',
  },
  linkedin: {
    clientId: configService.get<string>('LINKEDIN_CLIENT_ID'),
    clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET'),
    callbackUrl:
      configService.get<string>('LINKEDIN_CALLBACK_URL') || 'http://localhost:3000/api/auth/linkedin/callback',
    scope: ['r_liteprofile', 'r_emailaddress'],
  },
});

export const sessionConfig = (configService: ConfigService) => ({
  idleTimeout: parseInt(configService.get<string>('SESSION_IDLE_TIMEOUT') || '1800000', 10), // 30 min
  absoluteTimeout: parseInt(configService.get<string>('SESSION_ABSOLUTE_TIMEOUT') || '28800000', 10), // 8 hours
});
