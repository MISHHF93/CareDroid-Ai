import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;

  const mockAuditRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockAuditLog = {
    id: '1',
    userId: '1',
    action: AuditAction.LOGIN,
    resource: 'auth',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    timestamp: new Date(),
    phiAccessed: false,
    metadata: { sessionId: 'test123' },
    details: { userAgent: 'Chrome' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save audit log entry', async () => {
      const logData = {
        userId: '1',
        action: AuditAction.LOGIN,
        resource: 'auth',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        phiAccessed: false,
        metadata: { sessionId: 'test123' },
        details: { userAgent: 'Chrome' },
      };

      mockAuditRepository.create.mockReturnValue({
        ...logData,
        timestamp: expect.any(Date),
      });
      mockAuditRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(logData);

      expect(mockAuditRepository.create).toHaveBeenCalledWith({
        ...logData,
        timestamp: expect.any(Date),
      });
      expect(mockAuditRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockAuditLog);
    });

    it('should create audit log without optional fields', async () => {
      const logData = {
        action: AuditAction.SECURITY_EVENT,
        resource: 'system',
        ipAddress: '0.0.0.0',
        userAgent: 'system',
      };

      mockAuditRepository.create.mockReturnValue({
        ...logData,
        timestamp: expect.any(Date),
      });
      mockAuditRepository.save.mockResolvedValue({
        ...logData,
        timestamp: new Date(),
      });

      const result = await service.log(logData);

      expect(mockAuditRepository.create).toHaveBeenCalledWith({
        ...logData,
        timestamp: expect.any(Date),
      });
      expect(result).toBeDefined();
    });

    it('should handle PHI access logging', async () => {
      const logData = {
        userId: '1',
        action: AuditAction.PHI_ACCESS,
        resource: 'patient/123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        phiAccessed: true,
        metadata: { patientId: '123' },
      };

      mockAuditRepository.create.mockReturnValue({
        ...logData,
        timestamp: expect.any(Date),
      });
      mockAuditRepository.save.mockResolvedValue({
        ...mockAuditLog,
        ...logData,
      });

      const result = await service.log(logData);

      expect(mockAuditRepository.create).toHaveBeenCalledWith({
        ...logData,
        timestamp: expect.any(Date),
      });
      expect(result.phiAccessed).toBe(true);
    });
  });

  describe('findByUser', () => {
    it('should find audit logs for a user with default limit', async () => {
      const userId = '1';
      const mockLogs = [mockAuditLog];

      mockAuditRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByUser(userId);

      expect(mockAuditRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should find audit logs for a user with custom limit', async () => {
      const userId = '1';
      const limit = 50;
      const mockLogs = [mockAuditLog];

      mockAuditRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByUser(userId, limit);

      expect(mockAuditRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
        take: limit,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should return empty array when no logs found', async () => {
      const userId = 'nonexistent';

      mockAuditRepository.find.mockResolvedValue([]);

      const result = await service.findByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findPhiAccess', () => {
    it('should find PHI access logs within date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const mockPhiLogs = [
        {
          ...mockAuditLog,
          action: AuditAction.PHI_ACCESS,
          phiAccessed: true,
        },
      ];

      mockAuditRepository.find.mockResolvedValue(mockPhiLogs);

      const result = await service.findPhiAccess(startDate, endDate);

      expect(mockAuditRepository.find).toHaveBeenCalledWith({
        where: {
          phiAccessed: true,
        },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(mockPhiLogs);
    });

    it('should return empty array when no PHI access found', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      mockAuditRepository.find.mockResolvedValue([]);

      const result = await service.findPhiAccess(startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe('audit action types', () => {
    it('should handle all audit action types', async () => {
      const actions = [
        AuditAction.LOGIN,
        AuditAction.LOGOUT,
        AuditAction.REGISTRATION,
        AuditAction.PASSWORD_CHANGE,
        AuditAction.EMAIL_VERIFICATION,
        AuditAction.TWO_FACTOR_ENABLE,
        AuditAction.TWO_FACTOR_DISABLE,
        AuditAction.SUBSCRIPTION_CHANGE,
        AuditAction.DATA_EXPORT,
        AuditAction.DATA_DELETION,
        AuditAction.PHI_ACCESS,
        AuditAction.AI_QUERY,
        AuditAction.CLINICAL_DATA_ACCESS,
        AuditAction.SECURITY_EVENT,
        AuditAction.PROFILE_UPDATE,
      ];

      for (const action of actions) {
        const logData = {
          userId: '1',
          action,
          resource: 'test',
          ipAddress: '192.168.1.1',
          userAgent: 'test',
        };

        mockAuditRepository.create.mockReturnValue({
          ...logData,
          timestamp: expect.any(Date),
        });
        mockAuditRepository.save.mockResolvedValue({
          ...logData,
          timestamp: new Date(),
        });

        await service.log(logData);

        expect(mockAuditRepository.create).toHaveBeenCalledWith({
          ...logData,
          timestamp: expect.any(Date),
        });
      }
    });
  });

  describe('complex audit scenarios', () => {
    it('should handle AI query audit with usage metadata', async () => {
      const logData = {
        userId: '1',
        action: AuditAction.AI_QUERY,
        resource: 'ai/llm',
        ipAddress: '192.168.1.1',
        userAgent: 'CareDroid/1.0',
        metadata: {
          model: 'gpt-4o',
          tokensUsed: 150,
          tier: 'PROFESSIONAL',
        },
        details: {
          promptLength: 45,
          responseLength: 120,
        },
      };

      mockAuditRepository.create.mockReturnValue({
        ...logData,
        timestamp: expect.any(Date),
      });
      mockAuditRepository.save.mockResolvedValue({
        ...logData,
        timestamp: new Date(),
      });

      const result = await service.log(logData);

      expect(result.metadata).toEqual(logData.metadata);
      expect(result.action).toBe(AuditAction.AI_QUERY);
    });

    it('should handle clinical data access audit', async () => {
      const logData = {
        userId: '1',
        action: AuditAction.CLINICAL_DATA_ACCESS,
        resource: 'clinical/protocols',
        ipAddress: '192.168.1.1',
        userAgent: 'CareDroid/1.0',
        phiAccessed: false,
        metadata: {
          protocolId: 'protocol-123',
          searchTerm: 'hypertension',
        },
      };

      mockAuditRepository.create.mockReturnValue({
        ...logData,
        timestamp: expect.any(Date),
      });
      mockAuditRepository.save.mockResolvedValue({
        ...logData,
        timestamp: new Date(),
      });

      const result = await service.log(logData);

      expect(result.action).toBe(AuditAction.CLINICAL_DATA_ACCESS);
      expect(result.phiAccessed).toBe(false);
    });

    it('should handle security event without user ID', async () => {
      const logData = {
        action: AuditAction.SECURITY_EVENT,
        resource: 'auth/rate-limit',
        ipAddress: '192.168.1.100',
        userAgent: 'suspicious-bot',
        metadata: {
          eventType: 'rate_limit_exceeded',
          attempts: 10,
        },
      };

      mockAuditRepository.create.mockReturnValue({
        ...logData,
        timestamp: expect.any(Date),
      });
      mockAuditRepository.save.mockResolvedValue({
        ...logData,
        timestamp: new Date(),
      });

      const result = await service.log(logData);

      expect(result.userId).toBeUndefined();
      expect(result.action).toBe(AuditAction.SECURITY_EVENT);
    });
  });
});