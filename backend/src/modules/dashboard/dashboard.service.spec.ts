import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PatientService } from '../patients/patient.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPatientService: any;

  beforeEach(async () => {
    mockPatientService = {
      getCriticalPatients: jest.fn().mockResolvedValue([{ id: 'patient-1' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PatientService,
          useValue: mockPatientService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should return stats', async () => {
    const stats = await service.getStats();

    expect(stats).toHaveProperty('criticalPatients');
    expect(stats).toHaveProperty('activePatients');
    expect(stats).toHaveProperty('stablePatients');
    expect(stats).toHaveProperty('pendingLabs');
  });

  it('should fetch critical patients from patient service', async () => {
    const patients = await service.getCriticalPatients();

    expect(mockPatientService.getCriticalPatients).toHaveBeenCalledWith(10);
    expect(patients).toEqual([{ id: 'patient-1' }]);
  });
});
