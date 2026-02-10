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

  it('GET /dashboard/stats returns stats', () => {
    return request(app.getHttpServer())
      .get('/dashboard/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('criticalPatients');
        expect(res.body).toHaveProperty('activePatients');
      });
  });

  it('GET /dashboard/activity returns list', () => {
    return request(app.getHttpServer())
      .get('/dashboard/activity?limit=3')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.activities)).toBe(true);
      });
  });

  it('GET /dashboard/alerts returns list', () => {
    return request(app.getHttpServer())
      .get('/dashboard/alerts')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.alerts)).toBe(true);
      });
  });

  it('GET /dashboard/patients/critical returns patients', () => {
    return request(app.getHttpServer())
      .get('/dashboard/patients/critical')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.patients)).toBe(true);
        expect(res.body.patients[0]).toHaveProperty('id');
      });
  });

  // ─── Phase 2+ endpoint tests ───

  it('GET /dashboard/workload returns workload tasks', () => {
    return request(app.getHttpServer())
      .get('/dashboard/workload')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('tasks');
        expect(Array.isArray(res.body.tasks)).toBe(true);
        expect(res.body).toHaveProperty('shiftEnd');
      });
  });

  it('POST /dashboard/workload/toggle toggles a task', () => {
    return request(app.getHttpServer())
      .post('/dashboard/workload/toggle')
      .send({ taskId: 't1' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('success');
      });
  });

  it('GET /dashboard/mar-preview returns medications', () => {
    return request(app.getHttpServer())
      .get('/dashboard/mar-preview')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('medications');
        expect(Array.isArray(res.body.medications)).toBe(true);
        if (res.body.medications.length > 0) {
          expect(res.body.medications[0]).toHaveProperty('name');
          expect(res.body.medications[0]).toHaveProperty('patient');
          expect(res.body.medications[0]).toHaveProperty('dueAt');
          expect(res.body.medications[0]).toHaveProperty('route');
        }
      });
  });

  it('GET /dashboard/on-call returns roster', () => {
    return request(app.getHttpServer())
      .get('/dashboard/on-call')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('roster');
        expect(Array.isArray(res.body.roster)).toBe(true);
        if (res.body.roster.length > 0) {
          expect(res.body.roster[0]).toHaveProperty('name');
          expect(res.body.roster[0]).toHaveProperty('specialty');
          expect(res.body.roster[0]).toHaveProperty('status');
        }
      });
  });

  it('GET /dashboard/beds returns bed board', () => {
    return request(app.getHttpServer())
      .get('/dashboard/beds')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('unit');
        expect(res.body).toHaveProperty('beds');
        expect(Array.isArray(res.body.beds)).toBe(true);
      });
  });

  it('GET /dashboard/lab-timeline returns lab events', () => {
    return request(app.getHttpServer())
      .get('/dashboard/lab-timeline')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('events');
        expect(Array.isArray(res.body.events)).toBe(true);
        if (res.body.events.length > 0) {
          expect(res.body.events[0]).toHaveProperty('test');
          expect(res.body.events[0]).toHaveProperty('patient');
          expect(res.body.events[0]).toHaveProperty('status');
        }
      });
  });

  it('GET /dashboard/cds-reminders returns reminders', () => {
    return request(app.getHttpServer())
      .get('/dashboard/cds-reminders')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('reminders');
        expect(Array.isArray(res.body.reminders)).toBe(true);
        if (res.body.reminders.length > 0) {
          expect(res.body.reminders[0]).toHaveProperty('message');
          expect(res.body.reminders[0]).toHaveProperty('priority');
        }
      });
  });

  it('POST /dashboard/orders places an order', () => {
    return request(app.getHttpServer())
      .post('/dashboard/orders')
      .send({ patientId: 'patient-1', orderId: 'stat-cbc', label: 'Stat CBC' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', true);
      });
  });

  it('GET /dashboard/stats includes sparklines', () => {
    return request(app.getHttpServer())
      .get('/dashboard/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('sparklines');
        expect(res.body.sparklines).toHaveProperty('criticalPatients');
        expect(Array.isArray(res.body.sparklines.criticalPatients)).toBe(true);
      });
  });
});
