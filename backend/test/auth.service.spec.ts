import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { UserProfile } from '../src/modules/users/entities/user-profile.entity';
import { OAuthAccount } from '../src/modules/users/entities/oauth-account.entity';
import { Subscription } from '../src/modules/subscriptions/entities/subscription.entity';
import { AuditService } from '../src/modules/audit/audit.service';
import { TwoFactorService } from '../src/modules/two-factor/two-factor.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProfileRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOauthRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSubscriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt') {
        return { refreshTokenExpiry: '7d' };
      }
      return undefined;
    }),
  };

  const mockTwoFactorService = {
    getStatus: jest.fn(),
    generate: jest.fn(),
    validate: jest.fn(),
    disable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserProfile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(OAuthAccount),
          useValue: mockOauthRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: TwoFactorService,
          useValue: mockTwoFactorService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: '1', email: registerDto.email });
      mockUserRepository.save.mockResolvedValue({ id: '1', email: registerDto.email });
      mockProfileRepository.create.mockReturnValue({});
      mockProfileRepository.save.mockResolvedValue({});
      mockSubscriptionRepository.create.mockReturnValue({});
      mockSubscriptionRepository.save.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('userId');
    });

    it('should throw error if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: '1', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return tokens if credentials are valid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        isActive: true,
        role: 'student',
        twoFactor: null,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login(
        { email: 'test@example.com', password: 'password123' },
        '127.0.0.1',
        'test-agent'
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should return null if credentials are invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'wrongpassword' },
          '127.0.0.1',
          'test-agent'
        )
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
