import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDrugDto {
  @ApiProperty({ example: 'Aspirin' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'acetylsalicylic acid' })
  @IsString()
  genericName: string;

  @ApiProperty({ example: 'Analgesic, antipyretic, anti-inflammatory' })
  @IsString()
  category: string;

  @ApiProperty({ example: '81-325 mg once daily' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: 'Pain relief, fever reduction, cardiovascular protection' })
  @IsString()
  indications: string;

  @ApiProperty({ example: 'Bleeding disorders, active ulcers' })
  @IsString()
  @IsOptional()
  contraindications?: string;

  @ApiProperty({ example: 'GI upset, bleeding risk' })
  @IsString()
  @IsOptional()
  sideEffects?: string;

  @ApiProperty({ example: 'Warfarin, NSAIDs' })
  @IsString()
  @IsOptional()
  interactions?: string;
}

export class UpdateDrugDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  indications?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contraindications?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sideEffects?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  interactions?: string;
}

export class SearchDrugDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
