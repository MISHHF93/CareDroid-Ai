import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface TeacherOutput {
  id: string;
  query: string;
  timestamp: number;
  model: 'gpt-4' | 'claude-3' | string;
  predictions: {
    intent: string;
    confidence: number;
    reasoning: string;
  };
}

interface ClinicianAnnotation {
  teacher_id: string;
  clinician_id: string;
  correct_intent: string;
  confidence_assessment: 'accurate' | 'partial' | 'incorrect';
  notes: string;
  timestamp: number;
}

interface DistillationSample {
  id: string;
  query: string;
  teacher_intent: string;
  teacher_confidence: number;
  teacher_reasoning: string;
  final_intent: string;
  final_confidence: number;
  clinician_id: string;
  clinician_notes: string;
  quality_score: number;
  created_at: number;
  version: string;
}

@Injectable()
export class DistillationPipelineService {
  private readonly logger = new Logger(DistillationPipelineService.name);
  private dataPath: string;

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    this.dataPath = this.configService.get<string>(
      'DISTILLATION_DATA_PATH',
      '/workspaces/CareDroid-Ai/backend/ml-services/nlu/data/distillation',
    );
    this.ensureDataDirectories();
  }

  private ensureDataDirectories(): void {
    const dirs = [
      this.dataPath,
      path.join(this.dataPath, 'teacher_outputs'),
      path.join(this.dataPath, 'annotations'),
      path.join(this.dataPath, 'samples'),
      path.join(this.dataPath, 'checkpoints'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created distillation data directory: ${dir}`);
      }
    }
  }

  /**
   * Record a teacher model output (GPT/Claude prediction)
   * Called after external model generates response
   */
  async recordTeacherOutput(
    query: string,
    predictions: TeacherOutput['predictions'],
    model: string,
  ): Promise<string> {
    const teacherId = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const output: TeacherOutput = {
      id: teacherId,
      query,
      timestamp: Date.now(),
      model,
      predictions,
    };

    const outputPath = path.join(
      this.dataPath,
      'teacher_outputs',
      `${teacherId}.json`,
    );
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    this.logger.debug(
      `Recorded teacher output: ${teacherId} from model ${model}`,
    );

    return teacherId;
  }

  /**
   * Submit clinician correction/validation for a teacher output
   * Called when clinician reviews and corrects teacher prediction
   */
  async submitClinicianAnnotation(
    teacherId: string,
    clinicianId: string,
    correctIntent: string,
    confidenceAssessment: ClinicianAnnotation['confidence_assessment'],
    notes: string = '',
  ): Promise<DistillationSample> {
    // Load teacher output
    const outputPath = path.join(
      this.dataPath,
      'teacher_outputs',
      `${teacherId}.json`,
    );

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Teacher output not found: ${teacherId}`);
    }

    const teacher = JSON.parse(
      fs.readFileSync(outputPath, 'utf-8'),
    ) as TeacherOutput;

    // Record annotation
    const annotation: ClinicianAnnotation = {
      teacher_id: teacherId,
      clinician_id: clinicianId,
      correct_intent: correctIntent,
      confidence_assessment: confidenceAssessment,
      notes,
      timestamp: Date.now(),
    };

    const annotationPath = path.join(
      this.dataPath,
      'annotations',
      `${teacherId}_annotation.json`,
    );
    fs.writeFileSync(annotationPath, JSON.stringify(annotation, null, 2));

    // Create distillation sample
    const qualityScore = this.calculateQualityScore(
      teacher.predictions.intent === correctIntent,
      confidenceAssessment,
      teacher.predictions.confidence,
    );

    const sample: DistillationSample = {
      id: `sample_${teacherId}`,
      query: teacher.query,
      teacher_intent: teacher.predictions.intent,
      teacher_confidence: teacher.predictions.confidence,
      teacher_reasoning: teacher.predictions.reasoning,
      final_intent: correctIntent,
      final_confidence: this.calibrateConfidence(
        teacher.predictions.confidence,
        confidenceAssessment,
      ),
      clinician_id: clinicianId,
      clinician_notes: notes,
      quality_score: qualityScore,
      created_at: Date.now(),
      version: '1.0',
    };

    // Save sample for training
    const samplePath = path.join(
      this.dataPath,
      'samples',
      `sample_${teacherId}.json`,
    );
    fs.writeFileSync(samplePath, JSON.stringify(sample, null, 2));

    this.logger.log(
      `Clinician annotation recorded: ${teacherId} by ${clinicianId}`,
    );

    return sample;
  }

  /**
   * Get pending teacher outputs awaiting clinician review
   */
  async getPendingReviews(limit: number = 50): Promise<
    Array<{
      teacher_id: string;
      query: string;
      teacher_intent: string;
      teacher_confidence: number;
      created_hours_ago: number;
    }>
  > {
    const teacherDir = path.join(this.dataPath, 'teacher_outputs');
    const files = fs.readdirSync(teacherDir).sort().reverse();

    const pending = [];

    for (const file of files) {
      if (pending.length >= limit) break;

      const teacherId = file.replace('.json', '');
      const annotationPath = path.join(
        this.dataPath,
        'annotations',
        `${teacherId}_annotation.json`,
      );

      // Skip if already annotated
      if (fs.existsSync(annotationPath)) continue;

      const outputPath = path.join(teacherDir, file);
      const teacher = JSON.parse(
        fs.readFileSync(outputPath, 'utf-8'),
      ) as TeacherOutput;

      const hoursAgo = (Date.now() - teacher.timestamp) / (1000 * 60 * 60);

      pending.push({
        teacher_id: teacherId,
        query: teacher.query,
        teacher_intent: teacher.predictions.intent,
        teacher_confidence: teacher.predictions.confidence,
        created_hours_ago: Math.round(hoursAgo),
      });
    }

    return pending;
  }

  /**
   * Export distillation samples for model training
   */
  async exportTrainingDataset(
    minQualityScore: number = 0.6,
  ): Promise<string> {
    const samplesDir = path.join(this.dataPath, 'samples');
    const files = fs.readdirSync(samplesDir);

    const samples: DistillationSample[] = [];

    for (const file of files) {
      const sample = JSON.parse(
        fs.readFileSync(path.join(samplesDir, file), 'utf-8'),
      ) as DistillationSample;

      if (sample.quality_score >= minQualityScore) {
        samples.push(sample);
      }
    }

    const exportPath = path.join(
      this.dataPath,
      `training_dataset_${Date.now()}.jsonl`,
    );

    const jsonl = samples.map((s) => JSON.stringify(s)).join('\n');
    fs.writeFileSync(exportPath, jsonl);

    this.logger.log(
      `Exported ${samples.length} training samples to ${exportPath}`,
    );

    return exportPath;
  }

  /**
   * Get distillation pipeline statistics
   */
  async getStats(): Promise<{
    total_teacher_outputs: number;
    total_annotations: number;
    total_samples: number;
    avg_quality_score: number;
    agreement_rate: number;
    teacher_models: Record<string, number>;
    intent_distribution: Record<string, number>;
  }> {
    const teacherDir = path.join(this.dataPath, 'teacher_outputs');
    const annotationDir = path.join(this.dataPath, 'annotations');
    const samplesDir = path.join(this.dataPath, 'samples');

    const teacherFiles = fs.readdirSync(teacherDir);
    const annotationFiles = fs.readdirSync(annotationDir);
    const sampleFiles = fs.readdirSync(samplesDir);

    const samples: DistillationSample[] = [];
    const teacherModels: Record<string, number> = {};
    const intentDist: Record<string, number> = {};
    let correctCount = 0;

    for (const file of sampleFiles) {
      const sample = JSON.parse(
        fs.readFileSync(path.join(samplesDir, file), 'utf-8'),
      ) as DistillationSample;
      samples.push(sample);

      // Count correct predictions
      if (sample.teacher_intent === sample.final_intent) {
        correctCount++;
      }

      // Track intent distribution
      intentDist[sample.final_intent] =
        (intentDist[sample.final_intent] || 0) + 1;
    }

    // Count teacher models
    for (const file of teacherFiles) {
      const teacher = JSON.parse(
        fs.readFileSync(path.join(teacherDir, file), 'utf-8'),
      ) as TeacherOutput;
      teacherModels[teacher.model] = (teacherModels[teacher.model] || 0) + 1;
    }

    const avgQuality =
      samples.length > 0
        ? samples.reduce((sum, s) => sum + s.quality_score, 0) / samples.length
        : 0;

    return {
      total_teacher_outputs: teacherFiles.length,
      total_annotations: annotationFiles.length,
      total_samples: sampleFiles.length,
      avg_quality_score: Math.round(avgQuality * 1000) / 1000,
      agreement_rate: Math.round((correctCount / (sampleFiles.length || 1)) * 1000) / 1000,
      teacher_models: teacherModels,
      intent_distribution: intentDist,
    };
  }

  private calculateQualityScore(
    isCorrect: boolean,
    assessment: ClinicianAnnotation['confidence_assessment'],
    confidence: number,
  ): number {
    let baseScore = 0.5;

    if (isCorrect) {
      if (assessment === 'accurate') {
        baseScore = 1.0;
      } else if (assessment === 'partial') {
        baseScore = 0.85;
      } else {
        baseScore = 0.6;
      }
    } else {
      if (assessment === 'incorrect') {
        baseScore = 0.3;
      } else if (assessment === 'partial') {
        baseScore = 0.5;
      } else {
        baseScore = 0.4;
      }
    }

    // Adjust based on teacher confidence
    // High-confidence errors are worse, low-confidence errors are better
    const confidenceMultiplier = isCorrect ? 1 + confidence * 0.2 : 1 - confidence * 0.2;

    return Math.max(0, Math.min(1, baseScore * confidenceMultiplier));
  }

  private calibrateConfidence(
    teacherConfidence: number,
    assessment: ClinicianAnnotation['confidence_assessment'],
  ): number {
    if (assessment === 'accurate') {
      return Math.min(1.0, teacherConfidence * 1.1);
    } else if (assessment === 'partial') {
      return teacherConfidence * 0.8;
    } else {
      return Math.max(0, teacherConfidence * 0.3);
    }
  }
}
