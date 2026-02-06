import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface DriftAlert {
  timestamp: number;
  metric: string;
  baseline_value: number;
  recent_value: number;
  change_percent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommended_action: string;
}

interface DriftSnapshot {
  timestamp: number;
  window: string;
  metrics: {
    avg_confidence: number;
    accuracy: number;
    ece: number;
    intent_distribution: Record<string, number>;
    class_frequency_shift: Record<string, number>;
    escalation_rate: number;
    abstain_rate: number;
  };
  alerts: DriftAlert[];
}

interface DriftDashboardData {
  current_snapshot: DriftSnapshot;
  trend_24h: DriftSnapshot[];
  trend_7d: DriftSnapshot[];
  active_alerts: DriftAlert[];
  health_status: 'healthy' | 'degraded' | 'critical';
  recommendations: string[];
}

@Injectable()
export class DriftDetectionService {
  private readonly logger = new Logger(DriftDetectionService.name);
  private dashboardDataPath: string;
  private snapshotHistoryPath: string;

  constructor() {
    this.dashboardDataPath = path.join(
      '/workspaces/CareDroid-Ai/backend/ml-services/nlu/data',
      'drift_detection',
    );
    this.snapshotHistoryPath = path.join(this.dashboardDataPath, 'snapshots');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [this.dashboardDataPath, this.snapshotHistoryPath];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created drift detection directory: ${dir}`);
      }
    }
  }

  /**
   * Record a new metrics snapshot for drift tracking
   */
  recordSnapshot(metrics: {
    avg_confidence: number;
    accuracy: number;
    ece: number;
    intent_distribution: Record<string, number>;
    escalation_rate: number;
    abstain_rate: number;
  }): void {
    const snapshot: DriftSnapshot = {
      timestamp: Date.now(),
      window: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      metrics: {
        ...metrics,
        class_frequency_shift: {},
      },
      alerts: [],
    };

    const filename = `snapshot_${snapshot.timestamp}.json`;
    const filepath = path.join(this.snapshotHistoryPath, filename);
    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));

    this.logger.debug(`Recorded drift snapshot: ${filename}`);

    // Check for drifts
    this.detectDriftVsBaseline(snapshot);
  }

  /**
   * Detect drift in current metrics vs baseline
   */
  private detectDriftVsBaseline(currentSnapshot: DriftSnapshot): void {
    const baselineSnapshot = this.getBaselineSnapshot();

    if (!baselineSnapshot) {
      this.logger.debug('No baseline snapshot available for drift detection');
      return;
    }

    const alerts: DriftAlert[] = [];

    // Confidence drift (model is over/under-confident)
    const confidenceDrift = Math.abs(
      (currentSnapshot.metrics.avg_confidence -
        baselineSnapshot.metrics.avg_confidence) /
        (baselineSnapshot.metrics.avg_confidence || 0.001),
    );
    if (confidenceDrift > 0.2) {
      // 20% change
      alerts.push({
        timestamp: Date.now(),
        metric: 'avg_confidence',
        baseline_value: baselineSnapshot.metrics.avg_confidence,
        recent_value: currentSnapshot.metrics.avg_confidence,
        change_percent: Math.round(confidenceDrift * 10000) / 10000,
        severity: confidenceDrift > 0.4 ? 'high' : 'medium',
        recommended_action:
          'Review model calibration. Consider re-running calibration metrics.',
      });
    }

    // Accuracy drift (model performance degradation)
    const accuracyDrift = Math.abs(
      (currentSnapshot.metrics.accuracy - baselineSnapshot.metrics.accuracy) /
        (baselineSnapshot.metrics.accuracy || 0.001),
    );
    if (accuracyDrift > 0.15) {
      // 15% change
      alerts.push({
        timestamp: Date.now(),
        metric: 'accuracy',
        baseline_value: baselineSnapshot.metrics.accuracy,
        recent_value: currentSnapshot.metrics.accuracy,
        change_percent: Math.round(accuracyDrift * 10000) / 10000,
        severity: accuracyDrift > 0.3 ? 'critical' : 'high',
        recommended_action:
          'Model accuracy has degraded. Consider retraining or rolling back model version.',
      });
    }

    // ECE drift (calibration problem)
    const eceDrift = Math.abs(
      (currentSnapshot.metrics.ece - baselineSnapshot.metrics.ece) /
        (baselineSnapshot.metrics.ece || 0.01),
    );
    if (eceDrift > 0.25) {
      // 25% change
      alerts.push({
        timestamp: Date.now(),
        metric: 'ece',
        baseline_value: baselineSnapshot.metrics.ece,
        recent_value: currentSnapshot.metrics.ece,
        change_percent: Math.round(eceDrift * 10000) / 10000,
        severity: 'medium',
        recommended_action:
          'Calibration error has increased. Consider temperature scaling adjustment.',
      });
    }

    // Escalation rate drift (more human interventions)
    const escalationDrift = Math.abs(
      (currentSnapshot.metrics.escalation_rate -
        baselineSnapshot.metrics.escalation_rate) /
        (baselineSnapshot.metrics.escalation_rate || 0.01),
    );
    if (escalationDrift > 0.3) {
      // 30% change
      alerts.push({
        timestamp: Date.now(),
        metric: 'escalation_rate',
        baseline_value: baselineSnapshot.metrics.escalation_rate,
        recent_value: currentSnapshot.metrics.escalation_rate,
        change_percent: Math.round(escalationDrift * 10000) / 10000,
        severity: escalationDrift > 0.5 ? 'critical' : 'high',
        recommended_action:
          'Escalation rate has increased significantly. Investigate user query patterns.',
      });
    }

    // Abstain rate drift (model abstaining more often)
    const abstainDrift = Math.abs(
      (currentSnapshot.metrics.abstain_rate -
        baselineSnapshot.metrics.abstain_rate) /
        (baselineSnapshot.metrics.abstain_rate || 0.01),
    );
    if (abstainDrift > 0.35) {
      // 35% change
      alerts.push({
        timestamp: Date.now(),
        metric: 'abstain_rate',
        baseline_value: baselineSnapshot.metrics.abstain_rate,
        recent_value: currentSnapshot.metrics.abstain_rate,
        change_percent: Math.round(abstainDrift * 10000) / 10000,
        severity: 'high',
        recommended_action:
          'Model is abstaining more frequently. Review confidence thresholds.',
      });
    }

    currentSnapshot.alerts = alerts;

    if (alerts.length > 0) {
      this.logger.warn(
        `Drift detected: ${alerts.length} alert(s)`,
        alerts.map((a) => ({ metric: a.metric, severity: a.severity })),
      );
    }
  }

  /**
   * Get baseline snapshot (e.g., from 7 days ago)
   */
  private getBaselineSnapshot(): DriftSnapshot | null {
    const files = fs
      .readdirSync(this.snapshotHistoryPath)
      .sort()
      .reverse();

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filepath = path.join(this.snapshotHistoryPath, file);
      const snapshot = JSON.parse(
        fs.readFileSync(filepath, 'utf-8'),
      ) as DriftSnapshot;

      if (snapshot.timestamp < sevenDaysAgo) {
        return snapshot;
      }
    }

    // If no 7-day baseline, return oldest available
    if (files.length > 0) {
      const filepath = path.join(this.snapshotHistoryPath, files[files.length - 1]);
      return JSON.parse(fs.readFileSync(filepath, 'utf-8')) as DriftSnapshot;
    }

    return null;
  }

  /**
   * Get full drift dashboard data
   */
  async getDashboardData(): Promise<DriftDashboardData> {
    const files = fs
      .readdirSync(this.snapshotHistoryPath)
      .sort()
      .reverse();

    const now = Date.now();
    const snapshots24h = [];
    const snapshots7d = [];
    let currentSnapshot: DriftSnapshot | null = null;

    for (const file of files) {
      const filepath = path.join(this.snapshotHistoryPath, file);
      const snapshot = JSON.parse(
        fs.readFileSync(filepath, 'utf-8'),
      ) as DriftSnapshot;

      if (!currentSnapshot) {
        currentSnapshot = snapshot;
      }

      const ageMs = now - snapshot.timestamp;

      if (ageMs < 24 * 60 * 60 * 1000) {
        snapshots24h.push(snapshot);
      }

      if (ageMs < 7 * 24 * 60 * 60 * 1000) {
        snapshots7d.push(snapshot);
      }
    }

    if (!currentSnapshot) {
      currentSnapshot = {
        timestamp: now,
        window: new Date().toISOString().split('T')[0],
        metrics: {
          avg_confidence: 0,
          accuracy: 0,
          ece: 0,
          intent_distribution: {},
          class_frequency_shift: {},
          escalation_rate: 0,
          abstain_rate: 0,
        },
        alerts: [],
      };
    }

    // Aggregate active alerts
    const activeAlerts = snapshots7d
      .flatMap((s) => s.alerts)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    // Determine health status
    const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
    const highAlerts = activeAlerts.filter((a) => a.severity === 'high');

    let healthStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      healthStatus = 'critical';
    } else if (highAlerts.length > 1) {
      healthStatus = 'degraded';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentSnapshot,
      activeAlerts,
    );

    return {
      current_snapshot: currentSnapshot,
      trend_24h: snapshots24h,
      trend_7d: snapshots7d,
      active_alerts: activeAlerts,
      health_status: healthStatus,
      recommendations,
    };
  }

  private generateRecommendations(
    snapshot: DriftSnapshot,
    alerts: DriftAlert[],
  ): string[] {
    const recommendations: string[] = [];

    // Critical alerts
    if (alerts.some((a) => a.severity === 'critical')) {
      recommendations.push('⚠️  CRITICAL: Immediate action required. Review model health.');
      recommendations.push('Consider rolling back to previous model version.');
    }

    // High alerts
    if (alerts.some((a) => a.severity === 'high')) {
      recommendations.push('⚠️  HIGH: Degraded performance detected.');
      recommendations.push('Schedule model retraining with recent data.');
    }

    // Calibration issues
    if (alerts.some((a) => a.metric === 'ece')) {
      recommendations.push(
        'Apply temperature scaling to improve confidence calibration.',
      );
    }

    // Accuracy issues
    if (alerts.some((a) => a.metric === 'accuracy')) {
      recommendations.push('Review recent query patterns for distribution shift.');
      recommendations.push('Collect more labeled data for underrepresented intents.');
    }

    // Escalation issues
    if (alerts.some((a) => a.metric === 'escalation_rate')) {
      recommendations.push('Review critical keyword matching sensitivity.');
      recommendations.push(
        'Consider lowering confidence thresholds for problematic intents.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Model is operating normally.');
      recommendations.push('Continue monitoring for drift.');
    }

    return recommendations;
  }
}
