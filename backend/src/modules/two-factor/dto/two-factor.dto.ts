import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableTwoFactorDto {
  @ApiProperty({ example: 'JBSWY3DPEHPK3PXP' })
  @IsString()
  secret: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 8)
  token: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 8)
  token: string;
}
