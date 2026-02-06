import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';

export interface PatientFilterOptions {
  status?: string;
  search?: string;
  limit?: number;
}

@Injectable()
export class PatientService implements OnModuleInit {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async onModuleInit() {
    const count = await this.patientRepository.count();
    if (count === 0) {
      await this.seedPatients();
    }
  }

  async getPatients(options: PatientFilterOptions = {}): Promise<Patient[]> {
    const { status, search, limit = 20 } = options;

    const query = this.patientRepository.createQueryBuilder('patient');

    if (status && status !== 'all') {
      query.andWhere('patient.status = :status', { status });
    }

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      query.andWhere(
        'LOWER(patient.name) LIKE :term OR LOWER(patient.room) LIKE :term OR LOWER(patient.bed) LIKE :term OR LOWER(patient.admittingDiagnosis) LIKE :term',
        { term },
      );
    }

    query.orderBy('patient.updatedAt', 'DESC').take(limit);

    return query.getMany();
  }

  async getCriticalPatients(limit = 10): Promise<Patient[]> {
    return this.getPatients({ status: 'critical', limit });
  }

  private async seedPatients() {
    this.logger.log('Seeding patients data');

    const patients: Partial<Patient>[] = [
      {
        name: 'Sarah Johnson',
        age: 67,
        gender: 'Female',
        room: '312',
        bed: 'A',
        status: 'critical',
        admittingDiagnosis: 'Acute Myocardial Infarction with cardiogenic shock',
        vitals: {
          heartRate: { value: 118, unit: 'bpm', range: { min: 60, max: 100 } },
          bloodPressure: {
            systolic: 92,
            diastolic: 58,
            unit: 'mmHg',
            range: { min: 90, max: 140 },
          },
          temperature: {
            value: 38.9,
            unit: 'F',
            range: { min: 97, max: 99 },
          },
          oxygenSat: { value: 91, unit: '%', range: { min: 95, max: 100 } },
        },
        alerts: [
          { message: 'Sepsis criteria met', severity: 'critical' },
          { message: 'Elevated lactate', severity: 'high' },
        ],
        medications: ['Vancomycin', 'Piperacillin'],
      },
      {
        name: 'Michael Chen',
        age: 54,
        gender: 'Male',
        room: '205',
        bed: 'B',
        status: 'critical',
        admittingDiagnosis: 'Hyperkalemia with hypertensive urgency',
        vitals: {
          heartRate: { value: 102, unit: 'bpm', range: { min: 60, max: 100 } },
          bloodPressure: {
            systolic: 168,
            diastolic: 95,
            unit: 'mmHg',
            range: { min: 90, max: 140 },
          },
          temperature: {
            value: 37.2,
            unit: 'F',
            range: { min: 97, max: 99 },
          },
          oxygenSat: { value: 95, unit: '%', range: { min: 95, max: 100 } },
        },
        alerts: [
          { message: 'Hyperkalemia', severity: 'critical' },
          { message: 'Hypertensive urgency', severity: 'high' },
        ],
        medications: ['Lisinopril', 'Kayexalate'],
      },
      {
        name: 'Emily Davis',
        age: 42,
        gender: 'Female',
        room: '118',
        bed: 'C',
        status: 'urgent',
        admittingDiagnosis: 'Pneumonia with hypoxia',
        vitals: {
          heartRate: { value: 96, unit: 'bpm', range: { min: 60, max: 100 } },
          bloodPressure: {
            systolic: 128,
            diastolic: 82,
            unit: 'mmHg',
            range: { min: 90, max: 140 },
          },
          temperature: {
            value: 38.1,
            unit: 'F',
            range: { min: 97, max: 99 },
          },
          oxygenSat: { value: 92, unit: '%', range: { min: 95, max: 100 } },
        },
        alerts: [{ message: 'Oxygen saturation low', severity: 'high' }],
        medications: ['Azithromycin', 'Albuterol'],
      },
      {
        name: 'Robert Wilson',
        age: 71,
        gender: 'Male',
        room: '402',
        bed: 'A',
        status: 'stable',
        admittingDiagnosis: 'Post-operative recovery',
        vitals: {
          heartRate: { value: 78, unit: 'bpm', range: { min: 60, max: 100 } },
          bloodPressure: {
            systolic: 124,
            diastolic: 76,
            unit: 'mmHg',
            range: { min: 90, max: 140 },
          },
          temperature: {
            value: 36.9,
            unit: 'F',
            range: { min: 97, max: 99 },
          },
          oxygenSat: { value: 97, unit: '%', range: { min: 95, max: 100 } },
        },
        alerts: [],
        medications: ['Acetaminophen'],
      },
    ];

    await this.patientRepository.save(patients);
  }
}
