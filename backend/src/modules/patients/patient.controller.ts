import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { PatientQueryDto, PatientResponseDto } from './dto/patient.dto';
import { CreatePatientDto } from './dto/create-patient.dto';

@ApiTags('patients')
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @ApiOperation({ summary: 'Get patients with optional filters' })
  @ApiResponse({ status: 200, type: [PatientResponseDto] })
  async getPatients(@Query() query: PatientQueryDto): Promise<PatientResponseDto[]> {
    const limit = query.limit ? Number(query.limit) : undefined;
    return this.patientService.getPatients({
      status: query.status,
      search: query.search,
      limit,
    });
  }

  @Get('critical')
  @ApiOperation({ summary: 'Get critical patients' })
  @ApiResponse({ status: 200, type: [PatientResponseDto] })
  async getCriticalPatients(): Promise<PatientResponseDto[]> {
    return this.patientService.getCriticalPatients(10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatientById(@Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientService.getPatientById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created', type: PatientResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createPatient(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    return this.patientService.createPatient(dto);
  }
}
