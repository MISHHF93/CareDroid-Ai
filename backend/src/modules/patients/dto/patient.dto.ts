import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class PatientQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status (critical, urgent, stable, etc.)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search by patient name, room, or diagnosis' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Limit number of results' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class PatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  gender: string;

  @ApiProperty({ required: false })
  room?: string;

  @ApiProperty({ required: false })
  bed?: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  admittingDiagnosis?: string;

  @ApiProperty({ required: false })
  vitals?: Record<string, any>;

  @ApiProperty({ required: false })
  alerts?: Array<{ message: string; severity: string }>;

  @ApiProperty({ required: false })
  medications?: string[];
}
