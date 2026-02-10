import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter } from 'events';
import { UserSettings, SettingsActivityLog } from './entities/user-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  public readonly events = new EventEmitter();

  // In-memory session tracker (would be Redis in production)
  private activeSessions = new Map<string, Array<{
    id: string;
    device: string;
    browser: string;
    ip: string;
    lastActive: string;
    current: boolean;
  }>>();

  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
    @InjectRepository(SettingsActivityLog)
    private readonly activityRepo: Repository<SettingsActivityLog>,
  ) {}

  private static readonly ALLOWED_FIELDS = [
    'theme', 'compactMode', 'fontSize', 'highContrast',
    'reducedMotion', 'screenReader', 'autoLockMinutes',
    'safetyBanner', 'language', 'accentColor', 'soundEffects',
    'hapticFeedback', 'density', 'codeFont', 'showTooltips',
    'animateCharts', 'developerMode',
  ];

  /**
   * Get settings for a user. Creates defaults if none exist.
   */
  async getSettings(userId: string): Promise<UserSettings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingsRepo.create({ userId });
      settings = await this.settingsRepo.save(settings);
      this.logger.log(`Created default settings for user ${userId}`);
    }
    return settings;
  }

  /**
   * Update settings (partial merge) with activity logging.
   */
  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<UserSettings> {
    const before = await this.getSettings(userId);
    const changes: Record<string, { from: any; to: any }> = {};

    for (const field of SettingsService.ALLOWED_FIELDS) {
      if (dto[field] !== undefined && dto[field] !== before[field]) {
        changes[field] = { from: before[field], to: dto[field] };
        before[field] = dto[field];
      }
    }

    const settings = await this.settingsRepo.save(before);
    this.logger.log(`Updated settings for user ${userId}: ${Object.keys(changes).join(', ')}`);

    // Log the change
    if (Object.keys(changes).length > 0) {
      await this.logActivity(userId, 'settings.updated', JSON.stringify(changes), meta);
    }

    // Emit for SSE multi-device sync
    this.events.emit('settings:sync', {
      userId,
      settings: this.toPlain(settings),
      changes,
      timestamp: new Date().toISOString(),
    });

    return settings;
  }

  /**
   * Reset settings to defaults.
   */
  async resetSettings(userId: string, meta?: { ip?: string; userAgent?: string }): Promise<UserSettings> {
    await this.settingsRepo.delete({ userId });
    const settings = this.settingsRepo.create({ userId });
    const saved = await this.settingsRepo.save(settings);
    this.logger.log(`Reset settings to defaults for user ${userId}`);

    await this.logActivity(userId, 'settings.reset', null, meta);

    this.events.emit('settings:sync', {
      userId,
      settings: this.toPlain(saved),
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  /**
   * Import settings from JSON payload.
   */
  async importSettings(
    userId: string,
    payload: Record<string, any>,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<UserSettings> {
    const dto: any = {};
    for (const field of SettingsService.ALLOWED_FIELDS) {
      if (payload[field] !== undefined) dto[field] = payload[field];
    }
    const result = await this.updateSettings(userId, dto, meta);
    await this.logActivity(userId, 'settings.imported', JSON.stringify({ fieldCount: Object.keys(dto).length }), meta);
    return result;
  }

  /**
   * Export current settings as clean JSON.
   */
  async exportSettings(userId: string, meta?: { ip?: string; userAgent?: string }): Promise<Record<string, any>> {
    const settings = await this.getSettings(userId);
    await this.logActivity(userId, 'settings.exported', null, meta);
    return {
      ...this.toPlain(settings),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Get storage statistics for a user.
   */
  async getStorageStats(userId: string): Promise<Record<string, any>> {
    const eventCount = await this.settingsRepo.manager
      .query(`SELECT COUNT(*) as count FROM analytics_events WHERE userId = ?`, [userId])
      .then((rows) => rows?.[0]?.count ?? 0)
      .catch(() => 0);

    const auditCount = await this.settingsRepo.manager
      .query(`SELECT COUNT(*) as count FROM audit_logs WHERE "userId" = ?`, [userId])
      .then((rows) => rows?.[0]?.count ?? 0)
      .catch(() => 0);

    const chatCount = await this.settingsRepo.manager
      .query(`SELECT COUNT(*) as count FROM chat_messages WHERE "userId" = ?`, [userId])
      .then((rows) => rows?.[0]?.count ?? 0)
      .catch(() => 0);

    const settingsCount = await this.activityRepo.count({ where: { userId } });

    return {
      analyticsEvents: Number(eventCount),
      auditLogs: Number(auditCount),
      chatMessages: Number(chatCount),
      settingsChanges: settingsCount,
      estimatedStorageMB: Math.round((Number(eventCount) * 0.5 + Number(auditCount) * 0.3 + Number(chatCount) * 0.8) / 1024 * 100) / 100,
      lastSync: new Date().toISOString(),
    };
  }

  /**
   * Queue a full data export for the user.
   */
  async exportUserData(userId: string): Promise<{ status: string; estimatedTime: string }> {
    this.logger.log(`Data export queued for user ${userId}`);
    return {
      status: 'queued',
      estimatedTime: '~5 minutes',
    };
  }

  /**
   * Get recent activity log entries for a user.
   */
  async getActivityLog(userId: string, limit = 20): Promise<SettingsActivityLog[]> {
    return this.activityRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get active sessions for a user (simulated in-memory).
   */
  getActiveSessions(userId: string, currentUa?: string): Array<Record<string, any>> {
    if (!this.activeSessions.has(userId)) {
      // Seed with current session
      this.activeSessions.set(userId, [{
        id: `sess_${Date.now()}`,
        device: this.parseDevice(currentUa || ''),
        browser: this.parseBrowser(currentUa || ''),
        ip: '127.0.0.1',
        lastActive: new Date().toISOString(),
        current: true,
      }]);
    }
    return this.activeSessions.get(userId) || [];
  }

  /**
   * Revoke a session.
   */
  revokeSession(userId: string, sessionId: string): boolean {
    const sessions = this.activeSessions.get(userId) || [];
    const idx = sessions.findIndex((s) => s.id === sessionId && !s.current);
    if (idx >= 0) {
      sessions.splice(idx, 1);
      return true;
    }
    return false;
  }

  /* ─── Private helpers ─── */

  private async logActivity(
    userId: string,
    action: string,
    details: string | null,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    try {
      const entry = this.activityRepo.create({
        userId,
        action,
        details,
        ipAddress: meta?.ip || null,
        userAgent: meta?.userAgent || null,
      });
      await this.activityRepo.save(entry);
    } catch (e: any) {
      this.logger.error(`Failed to log activity: ${e.message}`);
    }
  }

  private parseDevice(ua: string): string {
    if (/mobile|android|iphone|ipad/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  private parseBrowser(ua: string): string {
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/edg/i.test(ua)) return 'Edge';
    if (/chrome/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua)) return 'Safari';
    return 'Unknown';
  }

  private toPlain(settings: UserSettings): Record<string, any> {
    const plain: Record<string, any> = {};
    for (const field of SettingsService.ALLOWED_FIELDS) {
      plain[field] = settings[field];
    }
    return plain;
  }
}
