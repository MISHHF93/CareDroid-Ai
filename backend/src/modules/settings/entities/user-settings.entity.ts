import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_settings')
@Index(['userId'], { unique: true })
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ default: 'system' })
  theme: string; // 'system' | 'light' | 'dark'

  @Column({ default: false })
  compactMode: boolean;

  @Column({ default: 'medium' })
  fontSize: string; // 'small' | 'medium' | 'large'

  @Column({ default: false })
  highContrast: boolean;

  @Column({ default: false })
  reducedMotion: boolean;

  @Column({ default: false })
  screenReader: boolean;

  @Column({ default: 15 })
  autoLockMinutes: number;

  @Column({ default: true })
  safetyBanner: boolean;

  @Column({ default: 'en' })
  language: string;

  @Column({ default: 'default' })
  accentColor: string; // 'default' | 'blue' | 'green' | 'purple' | 'amber' | 'rose'

  @Column({ default: true })
  soundEffects: boolean;

  @Column({ default: true })
  hapticFeedback: boolean;

  @Column({ default: 'comfortable' })
  density: string; // 'compact' | 'comfortable' | 'spacious'

  @Column({ default: 'standard' })
  codeFont: string; // 'standard' | 'mono' | 'dyslexic'

  @Column({ default: true })
  showTooltips: boolean;

  @Column({ default: true })
  animateCharts: boolean;

  @Column({ default: false })
  developerMode: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('settings_activity_log')
@Index(['userId', 'createdAt'])
export class SettingsActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string; // 'settings.updated' | 'settings.reset' | 'settings.imported' | 'settings.exported' | 'cache.cleared'

  @Column('text', { nullable: true })
  details: string; // JSON stringified diff or description

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
