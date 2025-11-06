import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'doctor@hospital.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Dr. John Smith' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PHYSICIAN, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
