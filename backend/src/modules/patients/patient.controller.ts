import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { PatientQueryDto, PatientResponseDto } from './dto/patient.dto';

@ApiTags('patients')
@Controller('api/patients')
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
}
