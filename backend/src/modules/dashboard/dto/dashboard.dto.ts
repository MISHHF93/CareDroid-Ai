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

  @ApiProperty({ required: false })
  @IsOptional()
  sparklines?: {
    criticalPatients?: number[];
    activePatients?: number[];
    pendingLabs?: number[];
    stablePatients?: number[];
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

/**
 * Workload Task DTO
 */
export class WorkloadTaskDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsBoolean()
  done: boolean;

  @ApiProperty()
  @IsString()
  priority: string;
}

/**
 * Workload Response DTO
 */
export class WorkloadDto {
  @ApiProperty({ type: [WorkloadTaskDto] })
  tasks: WorkloadTaskDto[];

  @ApiProperty()
  @IsString()
  shiftEnd: string;
}

/**
 * MAR Medication DTO
 */
export class MARMedicationDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  patient: string;

  @ApiProperty()
  @IsString()
  dueAt: string;

  @ApiProperty()
  @IsString()
  route: string;
}

/**
 * On-Call Roster Entry DTO
 */
export class RosterEntryDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  specialty: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  phone: string;
}

export enum BedStatus {
  OCCUPIED = 'occupied',
  AVAILABLE = 'available',
  CLEANING = 'cleaning',
  RESERVED = 'reserved',
}

/**
 * Bed DTO
 */
export class BedDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  room: string;

  @ApiProperty({ enum: BedStatus })
  @IsEnum(BedStatus)
  status: BedStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  acuity?: string;
}

/**
 * Bed Board Response DTO
 */
export class BedBoardDto {
  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty({ type: [BedDto] })
  beds: BedDto[];
}

/**
 * Lab Timeline Event DTO
 */
export class LabEventDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  test: string;

  @ApiProperty()
  @IsString()
  patient: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  orderedAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resultedAt?: string;

  @ApiProperty()
  @IsBoolean()
  critical: boolean;
}

/**
 * CDS Reminder DTO
 */
export class CDSReminderDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  icon: string;

  @ApiProperty()
  @IsString()
  priority: string;
}

/**
 * Toggle Task DTO
 */
export class ToggleTaskDto {
  @ApiProperty()
  @IsString()
  taskId: string;
}

/**
 * Place Order DTO
 */
export class PlaceOrderDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  label: string;
}
