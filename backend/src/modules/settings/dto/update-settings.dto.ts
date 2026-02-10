import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsString()
  fontSize?: string;

  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @IsOptional()
  @IsBoolean()
  reducedMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  screenReader?: boolean;

  @IsOptional()
  @IsNumber()
  autoLockMinutes?: number;

  @IsOptional()
  @IsBoolean()
  safetyBanner?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsBoolean()
  soundEffects?: boolean;

  @IsOptional()
  @IsBoolean()
  hapticFeedback?: boolean;

  @IsOptional()
  @IsString()
  density?: string;

  @IsOptional()
  @IsString()
  codeFont?: string;

  @IsOptional()
  @IsBoolean()
  showTooltips?: boolean;

  @IsOptional()
  @IsBoolean()
  animateCharts?: boolean;

  @IsOptional()
  @IsBoolean()
  developerMode?: boolean;
}

export class ImportSettingsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsString()
  fontSize?: string;

  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @IsOptional()
  @IsBoolean()
  reducedMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  screenReader?: boolean;

  @IsOptional()
  @IsNumber()
  autoLockMinutes?: number;

  @IsOptional()
  @IsBoolean()
  safetyBanner?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsBoolean()
  soundEffects?: boolean;

  @IsOptional()
  @IsBoolean()
  hapticFeedback?: boolean;

  @IsOptional()
  @IsString()
  density?: string;

  @IsOptional()
  @IsString()
  codeFont?: string;

  @IsOptional()
  @IsBoolean()
  showTooltips?: boolean;

  @IsOptional()
  @IsBoolean()
  animateCharts?: boolean;

  @IsOptional()
  @IsBoolean()
  developerMode?: boolean;
}
