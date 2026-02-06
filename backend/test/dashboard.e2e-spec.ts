import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DashboardController } from '../src/modules/dashboard/dashboard.controller';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { PatientService } from '../src/modules/patients/patient.service';

describe('Dashboard API (e2e)', () => {
  let app: INestApplication;
  let mockPatientService: any;

  beforeAll(async () => {
    mockPatientService = {
      getCriticalPatients: jest.fn().mockResolvedValue([
        { id: 'patient-1', name: 'Sarah Johnson', status: 'critical' },
      ]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
        {
          provide: PatientService,
          useValue: mockPatientService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/dashboard/stats returns stats', () => {
    return request(app.getHttpServer())
      .get('/api/dashboard/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('criticalPatients');
        expect(res.body).toHaveProperty('activePatients');
      });
  });

  it('GET /api/dashboard/activity returns list', () => {
    return request(app.getHttpServer())
      .get('/api/dashboard/activity?limit=3')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.activities)).toBe(true);
      });
  });

  it('GET /api/dashboard/alerts returns list', () => {
    return request(app.getHttpServer())
      .get('/api/dashboard/alerts')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.alerts)).toBe(true);
      });
  });

  it('GET /api/dashboard/patients/critical returns patients', () => {
    return request(app.getHttpServer())
      .get('/api/dashboard/patients/critical')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.patients)).toBe(true);
        expect(res.body.patients[0]).toHaveProperty('id');
      });
  });
});
