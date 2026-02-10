import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PatientController } from '../src/modules/patients/patient.controller';
import { PatientService } from '../src/modules/patients/patient.service';

describe('Patient CRUD API (e2e)', () => {
  let app: INestApplication;
  let mockPatientService: any;

  const VALID_PATIENT = {
    name: 'Jane Doe',
    age: 45,
    gender: 'Female',
    status: 'stable',
    room: '101',
    bed: 'A',
    admittingDiagnosis: 'Pneumonia',
  };

  const SAVED_PATIENT = {
    id: 'uuid-123',
    ...VALID_PATIENT,
    vitals: null,
    alerts: [],
    medications: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    mockPatientService = {
      getPatients: jest.fn().mockResolvedValue([SAVED_PATIENT]),
      getCriticalPatients: jest.fn().mockResolvedValue([]),
      getPatientById: jest.fn().mockImplementation((id: string) => {
        if (id === 'uuid-123') return Promise.resolve(SAVED_PATIENT);
        const err: any = new Error('Not Found');
        err.status = 404;
        err.response = { statusCode: 404, message: `Patient with id "${id}" not found` };
        return Promise.reject(err);
      }),
      createPatient: jest.fn().mockImplementation((dto: any) => {
        return Promise.resolve({ id: 'uuid-123', ...dto, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [
        { provide: PatientService, useValue: mockPatientService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /patients ───────────────────────────────────────
  describe('POST /patients', () => {
    it('201 — creates a patient with valid data', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send(VALID_PATIENT)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(res.body).toHaveProperty('name', 'Jane Doe');
          expect(res.body).toHaveProperty('age', 45);
          expect(res.body).toHaveProperty('gender', 'Female');
          expect(mockPatientService.createPatient).toHaveBeenCalledTimes(1);
        });
    });

    it('201 — creates a patient with only required fields', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'JD', age: 30, gender: 'Male' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'JD');
        });
    });

    it('201 — creates a patient with vitals, medications, and alerts', () => {
      const full = {
        ...VALID_PATIENT,
        vitals: { heartRate: { value: 80, unit: 'bpm' } },
        medications: ['Lisinopril', 'Metformin'],
        alerts: [{ message: 'Fall risk', severity: 'warning' }],
      };

      return request(app.getHttpServer())
        .post('/patients')
        .send(full)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('vitals');
          expect(res.body).toHaveProperty('medications');
          expect(res.body).toHaveProperty('alerts');
        });
    });

    it('400 — rejects when name is missing', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send({ age: 45, gender: 'Female' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          const msgs = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasNameError = msgs.some((m: string) =>
            m.toLowerCase().includes('name') || m.toLowerCase().includes('string')
          );
          expect(hasNameError).toBe(true);
        });
    });

    it('400 — rejects when age is out of range', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'Jane Doe', age: 200, gender: 'Female' })
        .expect(400)
        .expect((res) => {
          const msgs = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          const hasAgeError = msgs.some((m: string) =>
            m.toLowerCase().includes('max') || m.toLowerCase().includes('age') || m.toLowerCase().includes('150')
          );
          expect(hasAgeError).toBe(true);
        });
    });

    it('400 — rejects when gender is missing', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'Jane Doe', age: 45 })
        .expect(400);
    });

    it('400 — rejects when name is too short', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'A', age: 45, gender: 'Female' })
        .expect(400);
    });

    it('400 — rejects invalid status enum', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'Jane', age: 45, gender: 'Female', status: 'invalid-status' })
        .expect(400);
    });

    it('400 — rejects empty body', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .send({})
        .expect(400);
    });
  });

  // ─── GET /patients/:id ────────────────────────────────────
  describe('GET /patients/:id', () => {
    it('200 — returns patient by id', () => {
      return request(app.getHttpServer())
        .get('/patients/uuid-123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(res.body).toHaveProperty('name', 'Jane Doe');
          expect(mockPatientService.getPatientById).toHaveBeenCalledWith('uuid-123');
        });
    });

    it('calls service with correct id parameter', () => {
      return request(app.getHttpServer())
        .get('/patients/abc-def-ghi')
        .then(() => {
          expect(mockPatientService.getPatientById).toHaveBeenCalledWith('abc-def-ghi');
        });
    });
  });

  // ─── GET /patients ────────────────────────────────────────
  describe('GET /patients', () => {
    it('200 — returns patient list', () => {
      return request(app.getHttpServer())
        .get('/patients')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(mockPatientService.getPatients).toHaveBeenCalled();
        });
    });

    it('passes query params to service', () => {
      return request(app.getHttpServer())
        .get('/patients?status=critical&search=sarah')
        .expect(200)
        .then(() => {
          expect(mockPatientService.getPatients).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'critical', search: 'sarah' }),
          );
        });
    });
  });
});
