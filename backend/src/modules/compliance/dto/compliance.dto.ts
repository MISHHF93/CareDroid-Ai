import { IsEmail, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  confirmEmail: string;
}

export class UpdateConsentDto {
  @ApiProperty({ example: 'marketing', enum: ['marketing', 'analytics', 'thirdParty'] })
  @IsString()
  consentType: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  granted: boolean;
}
