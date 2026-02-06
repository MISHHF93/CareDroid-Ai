import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface ClassificationMetric {
  timestamp: number;
  intent: string;
  confidence: number;
  predicted_correct: boolean;
  method: 'keyword' | 'nlu' | 'llm' | 'abstain';
}

interface CalibrationMetrics {
  expected_calibration_error: number; // ECE
  brier_score: number;
  max_calibration_error: number;
  avg_confidence: number;
  accuracy: number;
  per_intent_metrics: Record<
    string,
    {
      precision: number;
      recall: number;
      f1: number;
      support: number;
      confidence_bin_ece: number;
    }
  >;
}

interface ConfusionMatrix {
  [predicted: string]: {
    [actual: string]: number;
  };
}

@Injectable()
export class CalibrationMetricsService {
  private readonly logger = new Logger(CalibrationMetricsService.name);
  private metricsPath: string;
  private confidenceBins = 10; // 0-0.1, 0.1-0.2, ..., 0.9-1.0

  constructor() {
    this.metricsPath = path.join(
      '/workspaces/CareDroid-Ai/backend/ml-services/nlu/data',
      'calibration_metrics',
    );
    this.ensureMetricsDirectory();
  }

  private ensureMetricsDirectory(): void {
    if (!fs.existsSync(this.metricsPath)) {
      fs.mkdirSync(this.metricsPath, { recursive: true });
      this.logger.log(
        `Created calibration metrics directory: ${this.metricsPath}`,
      );
    }
  }

  /**
   * Record a single classification for metric aggregation
   */
  recordClassification(
    intent: string,
    confidence: number,
    method: ClassificationMetric['method'],
    predicted_correct: boolean,
  ): void {
    const metric: ClassificationMetric = {
      timestamp: Date.now(),
      intent,
      confidence,
      predicted_correct,
      method,
    };

    const metricsFile = path.join(this.metricsPath, 'recent-metrics.jsonl');
    const line = JSON.stringify(metric) + '\n';

    fs.appendFileSync(metricsFile, line);
  }

  /**
   * Compute calibration metrics from collected data
   */
  async computeCalibrationMetrics(
    windowSizeMs: number = 7 * 24 * 60 * 60 * 1000, // 7 days
  ): Promise<CalibrationMetrics> {
    const metricsFile = path.join(this.metricsPath, 'recent-metrics.jsonl');

    if (!fs.existsSync(metricsFile)) {
      this.logger.warn('No metrics file found');
      return this.getEmptyMetrics();
    }

    const lines = fs
      .readFileSync(metricsFile, 'utf-8')
      .split('\n')
      .filter((line) => line.trim());

    const cutoffTime = Date.now() - windowSizeMs;
    const metrics: ClassificationMetric[] = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((m) => m && m.timestamp > cutoffTime);

    if (metrics.length === 0) {
      this.logger.warn('No metrics in window');
      return this.getEmptyMetrics();
    }

    // Compute ECE (Expected Calibration Error)
    const ece = this.computeECE(metrics);
    const brierScore = this.computeBrierScore(metrics);
    const maxCalError = this.computeMaxCalibrationError(metrics);
    const avgConf =
      metrics.reduce((sum, m) => sum + m.confidence, 0) / metrics.length;
    const accuracy =
      metrics.filter((m) => m.predicted_correct).length / metrics.length;

    // Per-intent metrics
    const perIntentMetrics = this.computePerIntentMetrics(metrics);

    const calibrationMetrics: CalibrationMetrics = {
      expected_calibration_error: Math.round(ece * 10000) / 10000,
      brier_score: Math.round(brierScore * 10000) / 10000,
      max_calibration_error: Math.round(maxCalError * 10000) / 10000,
      avg_confidence: Math.round(avgConf * 10000) / 10000,
      accuracy: Math.round(accuracy * 10000) / 10000,
      per_intent_metrics: perIntentMetrics,
    };

    // Save metrics
    const timestamp = new Date().toISOString();
    const metricsOutput = path.join(
      this.metricsPath,
      `metrics_${timestamp.split(':').join('-')}.json`,
    );
    fs.writeFileSync(metricsOutput, JSON.stringify(calibrationMetrics, null, 2));

    this.logger.log(
      `Computed calibration metrics: ECE=${calibrationMetrics.expected_calibration_error}, Brier=${calibrationMetrics.brier_score}`,
    );

    return calibrationMetrics;
  }

  /**
   * Detect calibration drift over time
   */
  async detectDrift(
    recentWindowMs: number = 24 * 60 * 60 * 1000, // 1 day
    baselineWindowMs: number = 7 * 24 * 60 * 60 * 1000, // 7 days
  ): Promise<{
    has_drift: boolean;
    drift_metrics: {
      metric: string;
      baseline: number;
      recent: number;
      change_percent: number;
      is_concerning: boolean;
    }[];
  }> {
    const metricsFile = path.join(this.metricsPath, 'recent-metrics.jsonl');

    if (!fs.existsSync(metricsFile)) {
      return { has_drift: false, drift_metrics: [] };
    }

    const lines = fs
      .readFileSync(metricsFile, 'utf-8')
      .split('\n')
      .filter((line) => line.trim());

    const now = Date.now();
    const baselineMetrics = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(
        (m) =>
          m &&
          m.timestamp > now - baselineWindowMs &&
          m.timestamp <= now - (baselineWindowMs - recentWindowMs),
      );

    const recentMetrics = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((m) => m && m.timestamp > now - recentWindowMs);

    if (baselineMetrics.length === 0 || recentMetrics.length === 0) {
      return { has_drift: false, drift_metrics: [] };
    }

    // Compare key metrics
    const baselineECE = this.computeECE(baselineMetrics);
    const recentECE = this.computeECE(recentMetrics);

    const baselineAccuracy =
      baselineMetrics.filter((m) => m.predicted_correct).length /
      baselineMetrics.length;
    const recentAccuracy =
      recentMetrics.filter((m) => m.predicted_correct).length /
      recentMetrics.length;

    const baselineAvgConf =
      baselineMetrics.reduce((sum, m) => sum + m.confidence, 0) /
      baselineMetrics.length;
    const recentAvgConf =
      recentMetrics.reduce((sum, m) => sum + m.confidence, 0) /
      recentMetrics.length;

    const metrics = [
      {
        metric: 'expected_calibration_error',
        baseline: baselineECE,
        recent: recentECE,
        threshold: 0.15, // 15% change is concerning
      },
      {
        metric: 'accuracy',
        baseline: baselineAccuracy,
        recent: recentAccuracy,
        threshold: 0.1, // 10% change is concerning
      },
      {
        metric: 'avg_confidence',
        baseline: baselineAvgConf,
        recent: recentAvgConf,
        threshold: 0.15, // 15% change is concerning
      },
    ];

    const driftMetrics = metrics.map((m) => {
      const changePercent = Math.abs(
        (m.recent - m.baseline) / (m.baseline || 0.001),
      );
      return {
        metric: m.metric,
        baseline: Math.round(m.baseline * 10000) / 10000,
        recent: Math.round(m.recent * 10000) / 10000,
        change_percent: Math.round(changePercent * 10000) / 10000,
        is_concerning: changePercent > m.threshold,
      };
    });

    const hasDrift = driftMetrics.some((m) => m.is_concerning);

    if (hasDrift) {
      this.logger.warn(`Calibration drift detected:`, driftMetrics);
    }

    return { has_drift: hasDrift, drift_metrics: driftMetrics };
  }

  private computeECE(metrics: ClassificationMetric[]): number {
    if (metrics.length === 0) return 0;

    // Divide into bins by confidence
    const bins: ClassificationMetric[][] = Array.from(
      { length: this.confidenceBins },
      () => [],
    );

    for (const metric of metrics) {
      const binIndex = Math.min(
        Math.floor(metric.confidence * this.confidenceBins),
        this.confidenceBins - 1,
      );
      bins[binIndex].push(metric);
    }

    let ece = 0;
    let totalCount = 0;

    for (const bin of bins) {
      if (bin.length === 0) continue;

      const avgConfidence = bin.reduce((sum, m) => sum + m.confidence, 0) / bin.length;
      const accuracy = bin.filter((m) => m.predicted_correct).length / bin.length;
      const calibrationError = Math.abs(avgConfidence - accuracy);

      ece += (bin.length / metrics.length) * calibrationError;
      totalCount += bin.length;
    }

    return ece;
  }

  private computeBrierScore(metrics: ClassificationMetric[]): number {
    if (metrics.length === 0) return 0;

    const sumSquaredErrors = metrics.reduce((sum, m) => {
      const predicted = m.predicted_correct ? 1 : 0;
      const error = (m.confidence - predicted) ** 2;
      return sum + error;
    }, 0);

    return sumSquaredErrors / metrics.length;
  }

  private computeMaxCalibrationError(metrics: ClassificationMetric[]): number {
    if (metrics.length === 0) return 0;

    const bins: ClassificationMetric[][] = Array.from(
      { length: this.confidenceBins },
      () => [],
    );

    for (const metric of metrics) {
      const binIndex = Math.min(
        Math.floor(metric.confidence * this.confidenceBins),
        this.confidenceBins - 1,
      );
      bins[binIndex].push(metric);
    }

    let maxError = 0;

    for (const bin of bins) {
      if (bin.length === 0) continue;

      const avgConfidence = bin.reduce((sum, m) => sum + m.confidence, 0) / bin.length;
      const accuracy = bin.filter((m) => m.predicted_correct).length / bin.length;
      const error = Math.abs(avgConfidence - accuracy);

      maxError = Math.max(maxError, error);
    }

    return maxError;
  }

  private computePerIntentMetrics(
    metrics: ClassificationMetric[],
  ): Record<
    string,
    {
      precision: number;
      recall: number;
      f1: number;
      support: number;
      confidence_bin_ece: number;
    }
  > {
    const intentMap: Record<string, ClassificationMetric[]> = {};

    for (const metric of metrics) {
      if (!intentMap[metric.intent]) {
        intentMap[metric.intent] = [];
      }
      intentMap[metric.intent].push(metric);
    }

    const result: Record<
      string,
      {
        precision: number;
        recall: number;
        f1: number;
        support: number;
        confidence_bin_ece: number;
      }
    > = {};

    for (const [intent, intentMetrics] of Object.entries(intentMap)) {
      const truePositives = intentMetrics.filter(
        (m) => m.predicted_correct,
      ).length;
      const support = intentMetrics.length;
      const accuracy = truePositives / support;

      // For precision/recall, we approximate with accuracy (simplified)
      const precision = accuracy;
      const recall = accuracy;
      const f1 =
        precision + recall > 0
          ? (2 * precision * recall) / (precision + recall)
          : 0;

      const ece = this.computeECE(intentMetrics);

      result[intent] = {
        precision: Math.round(precision * 10000) / 10000,
        recall: Math.round(recall * 10000) / 10000,
        f1: Math.round(f1 * 10000) / 10000,
        support,
        confidence_bin_ece: Math.round(ece * 10000) / 10000,
      };
    }

    return result;
  }

  private getEmptyMetrics(): CalibrationMetrics {
    return {
      expected_calibration_error: 0,
      brier_score: 0,
      max_calibration_error: 0,
      avg_confidence: 0,
      accuracy: 0,
      per_intent_metrics: {},
    };
  }
}
