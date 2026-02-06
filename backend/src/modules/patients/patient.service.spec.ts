import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientService } from './patient.service';
import { Patient } from './patient.entity';

describe('PatientService', () => {
  let service: PatientService;
  let repository: Repository<Patient>;

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockRepository = {
    count: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    repository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPatients', () => {
    it('should return patients with default limit', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getPatients();

      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should apply status filter', async () => {
      await service.getPatients({ status: 'critical' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'patient.status = :status',
        { status: 'critical' },
      );
    });

    it('should apply search filter', async () => {
      await service.getPatients({ search: 'sarah' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(patient.name) LIKE :term OR LOWER(patient.room) LIKE :term OR LOWER(patient.bed) LIKE :term OR LOWER(patient.admittingDiagnosis) LIKE :term',
        { term: '%sarah%' },
      );
    });
  });

  describe('getCriticalPatients', () => {
    it('should fetch critical patients with limit', async () => {
      const spy = jest.spyOn(service, 'getPatients').mockResolvedValue([]);

      await service.getCriticalPatients(5);

      expect(spy).toHaveBeenCalledWith({ status: 'critical', limit: 5 });
    });
  });
});
