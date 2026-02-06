import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ActivityType {
  LAB = 'lab',
  MEDICATION = 'medication',
  VITAL = 'vital',
  ADMISSION = 'admission',
  DISCHARGE = 'discharge',
  PROCEDURE = 'procedure',
  NOTE = 'note',
  IMAGING = 'imaging',
  CONSULT = 'consult',
}

/**
 * Dashboard Stats DTO
 */
export class DashboardStatsDto {
  @ApiProperty()
  @IsNumber()
  criticalPatients: number;

  @ApiProperty()
  @IsNumber()
  activePatients: number;

  @ApiProperty()
  @IsNumber()
  stablePatients: number;

  @ApiProperty()
  @IsNumber()
  pendingLabs: number;

  @ApiProperty()
  trends: {
    criticalPatients?: { value: number; direction: 'up' | 'down' | 'neutral' };
    activePatients?: { value: number; direction: 'up' | 'down' | 'neutral' };
  };
}

/**
 * Activity DTO
 */
export class ActivityDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  patientName: string;

  @ApiProperty()
  @IsDate()
  timestamp: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  severity?: string;
}

/**
 * Alert DTO
 */
export class AlertDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  patientName: string;

  @ApiProperty()
  @IsDate()
  timestamp: Date;

  @ApiProperty()
  @IsBoolean()
  acknowledged: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;
}

/**
 * Tool Access Tracking DTO
 */
export class ToolAccessDto {
  @ApiProperty()
  @IsString()
  toolId: string;

  @ApiProperty()
  @IsString()
  timestamp: string;
}
