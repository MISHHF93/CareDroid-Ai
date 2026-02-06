import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PatientStatus = 'critical' | 'urgent' | 'moderate' | 'stable' | 'discharged';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column('int')
  age: number;

  @Column({ length: 32 })
  gender: string;

  @Column({ length: 20, nullable: true })
  room?: string;

  @Column({ length: 20, nullable: true })
  bed?: string;

  @Column({ length: 20, default: 'stable' })
  status: PatientStatus;

  @Column({ length: 400, nullable: true })
  admittingDiagnosis?: string;

  @Column('simple-json', { nullable: true })
  vitals?: Record<string, any>;

  @Column('simple-json', { nullable: true })
  alerts?: Array<{ message: string; severity: string }>;

  @Column('simple-json', { nullable: true })
  medications?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
