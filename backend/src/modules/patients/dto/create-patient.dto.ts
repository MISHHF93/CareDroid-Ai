import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PatientStatus } from '../patient.entity';

class AlertEntryDto {
  @ApiProperty({ description: 'Alert message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Alert severity', enum: ['critical', 'high', 'warning', 'info'] })
  @IsString()
  severity: string;
}

export class CreatePatientDto {
  @ApiProperty({ description: 'Full name of the patient', example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ description: 'Patient age in years', example: 45 })
  @IsNumber()
  @Min(0)
  @Max(150)
  age: number;

  @ApiProperty({ description: 'Patient gender', example: 'Female' })
  @IsString()
  @MaxLength(32)
  gender: string;

  @ApiPropertyOptional({
    description: 'Patient acuity status',
    enum: ['critical', 'urgent', 'moderate', 'stable', 'discharged'],
    default: 'stable',
  })
  @IsOptional()
  @IsEnum(['critical', 'urgent', 'moderate', 'stable', 'discharged'] as const)
  status?: PatientStatus;

  @ApiPropertyOptional({ description: 'Room number', example: '312' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  room?: string;

  @ApiPropertyOptional({ description: 'Bed identifier', example: 'A' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bed?: string;

  @ApiPropertyOptional({
    description: 'Admitting diagnosis',
    example: 'Acute Myocardial Infarction',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  admittingDiagnosis?: string;

  @ApiPropertyOptional({ description: 'Patient vitals as JSON object' })
  @IsOptional()
  @IsObject()
  vitals?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Active alerts', type: [AlertEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlertEntryDto)
  alerts?: AlertEntryDto[];

  @ApiPropertyOptional({ description: 'Current medications', example: ['Lisinopril', 'Metformin'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];
}
