import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { oauthConfig } from '../../../config/auth.config';
import { OAuthProvider } from '../../users/entities/oauth-account.entity';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const config = oauthConfig(configService);
    super({
      clientID: config.linkedin.clientId,
      clientSecret: config.linkedin.clientSecret,
      callbackURL: config.linkedin.callbackUrl,
      scope: config.linkedin.scope,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, emails, displayName } = profile;

    const user = {
      id,
      email: emails[0].value,
      name: displayName,
    };

    const result = await this.authService.validateOAuthLogin(OAuthProvider.LINKEDIN, user);

    done(null, result);
  }
}
