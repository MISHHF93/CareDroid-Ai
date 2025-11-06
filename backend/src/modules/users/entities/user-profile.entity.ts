import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string; // Will be encrypted at rest

  @Column({ type: 'varchar', length: 128, nullable: true })
  firstName: string; // Will be encrypted at rest

  @Column({ type: 'varchar', length: 128, nullable: true })
  lastName: string; // Will be encrypted at rest

  @Column({ type: 'varchar', length: 255, nullable: true })
  institution: string; // Will be encrypted at rest

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialty: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  licenseNumber: string; // Will be encrypted at rest

  @Column({ type: 'varchar', length: 50, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  languagePreference: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean; // Institutional verification status

  @Column({ type: 'integer', default: 0 })
  trustScore: number; // 0-100 reputation score

  @Column({ type: 'text', nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
