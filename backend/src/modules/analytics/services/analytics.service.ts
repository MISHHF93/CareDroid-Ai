import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { EventEmitter } from 'events';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

export interface EventMetrics {
  totalEvents: number;
  uniqueUsers: number;
  topEvents: Array<{ event: string; count: number }>;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  public readonly events = new EventEmitter();

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Track a single event
   */
  async trackEvent(
    event: string,
    userId?: string,
    sessionId?: string,
    properties?: Record<string, any>,
  ): Promise<AnalyticsEvent> {
    const analyticsEvent = this.analyticsEventRepository.create({
      event,
      userId,
      sessionId,
      properties: properties || {},
      platform: properties?.platform,
      userAgent: properties?.userAgent,
      screenResolution: properties?.screenResolution,
      referrer: properties?.referrer,
    });

    const saved = await this.analyticsEventRepository.save(analyticsEvent);
    this.events.emit('analytics:event', { id: saved.id, event: saved.event, userId: saved.userId, timestamp: saved.createdAt });
    return saved;
  }

  /**
   * Track multiple events in bulk
   */
  async trackEventsBulk(
    events: Array<{
      event: string;
      userId?: string;
      sessionId?: string;
      properties?: Record<string, any>;
      timestamp?: string;
    }>,
  ): Promise<void> {
    const analyticsEvents = events.map(e =>
      this.analyticsEventRepository.create({
        event: e.event,
        userId: e.userId,
        sessionId: e.sessionId,
        properties: e.properties || {},
        platform: e.properties?.platform,
        userAgent: e.properties?.userAgent,
        screenResolution: e.properties?.screenResolution,
        referrer: e.properties?.referrer,
        createdAt: e.timestamp ? new Date(e.timestamp) : new Date(),
      }),
    );

    await this.analyticsEventRepository.save(analyticsEvents);
    this.logger.log(`Tracked ${events.length} events in bulk`);
    analyticsEvents.forEach(e => {
      this.events.emit('analytics:event', { id: e.id, event: e.event, userId: e.userId, timestamp: e.createdAt });
    });
  }

  /**
   * Get event metrics for a date range
   */
  async getEventMetrics(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<EventMetrics> {
    const whereClause: any = {
      createdAt: Between(startDate, endDate),
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const events = await this.analyticsEventRepository.find({
      where: whereClause,
    });

    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;

    // Count events by type
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // DAU (Daily Active Users)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dailyActiveUsers = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.createdAt > :yesterday', { yesterday })
      .getRawOne()
      .then(result => parseInt(result.count) || 0);

    // WAU (Weekly Active Users)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weeklyActiveUsers = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.createdAt > :lastWeek', { lastWeek })
      .getRawOne()
      .then(result => parseInt(result.count) || 0);

    // MAU (Monthly Active Users)
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const monthlyActiveUsers = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.createdAt > :lastMonth', { lastMonth })
      .getRawOne()
      .then(result => parseInt(result.count) || 0);

    return {
      totalEvents,
      uniqueUsers,
      topEvents,
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
    };
  }

  /**
   * Get events by user
   */
  async getEventsByUser(
    userId: string,
    limit: number = 100,
  ): Promise<AnalyticsEvent[]> {
    return await this.analyticsEventRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get events by session
   */
  async getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]> {
    return await this.analyticsEventRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get funnel analytics
   */
  async getFunnelAnalytics(
    events: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ event: string; count: number; dropoff: number }>> {
    const funnelData = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const count = await this.analyticsEventRepository.count({
        where: {
          event,
          createdAt: Between(startDate, endDate),
        },
      });

      const dropoff = i > 0 ? funnelData[i - 1].count - count : 0;

      funnelData.push({
        event,
        count,
        dropoff,
      });
    }

    return funnelData;
  }

  /**
   * Get retention metrics
   */
  async getRetentionMetrics(
    startDate: Date,
  ): Promise<Array<{ day: number; retentionRate: number }>> {
    const retentionData = [];

    // Get users who signed up on start date
    const cohortUsers = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select('DISTINCT event.userId', 'userId')
      .where('event.event = :event', { event: 'user_identified' })
      .andWhere('DATE(event.createdAt) = DATE(:startDate)', { startDate })
      .getRawMany();

    const cohortUserIds = cohortUsers.map(u => u.userId);
    const cohortSize = cohortUserIds.length;

    if (cohortSize === 0) {
      return [];
    }

    // Check retention for next 30 days
    for (let day = 1; day <= 30; day++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + day);

      const activeUsers = await this.analyticsEventRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.userId)', 'count')
        .where('event.userId IN (:...userIds)', { userIds: cohortUserIds })
        .andWhere('DATE(event.createdAt) = DATE(:checkDate)', { checkDate })
        .getRawOne();

      const retentionRate = (parseInt(activeUsers.count) / cohortSize) * 100;

      retentionData.push({
        day,
        retentionRate: parseFloat(retentionRate.toFixed(2)),
      });
    }

    return retentionData;
  }

  /**
   * Cleanup old analytics events
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.analyticsEventRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old analytics events`);
    return result.affected || 0;
  }

  /**
   * Get event trends (hourly or daily aggregation)
   */
  async getTrends(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' = 'day',
  ): Promise<Array<{ period: string; count: number }>> {
    const events = await this.analyticsEventRepository.find({
      where: { createdAt: Between(startDate, endDate) },
      order: { createdAt: 'ASC' },
    });

    const buckets: Record<string, number> = {};
    events.forEach(e => {
      const d = new Date(e.createdAt);
      let key: string;
      if (granularity === 'hour') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:00`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      buckets[key] = (buckets[key] || 0) + 1;
    });

    return Object.entries(buckets).map(([period, count]) => ({ period, count }));
  }

  /**
   * Get top tools by usage count with trend %
   */
  async getTopTools(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<Array<{ tool: string; count: number; trend: number }>> {
    const rangeDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const priorStart = new Date(startDate.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    const currentEvents = await this.analyticsEventRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });
    const priorEvents = await this.analyticsEventRepository.find({
      where: { createdAt: Between(priorStart, startDate) },
    });

    const toolFilter = (ev: AnalyticsEvent) =>
      ev.event === 'tool_access' || ev.event === 'tool_used' || ev.event.startsWith('tool_');

    const countByTool = (events: AnalyticsEvent[]) =>
      events.filter(toolFilter).reduce((acc, e) => {
        const tool = (e.properties as any)?.toolId || (e.properties as any)?.tool || e.event;
        acc[tool] = (acc[tool] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const currentCounts = countByTool(currentEvents);
    const priorCounts = countByTool(priorEvents);

    return Object.entries(currentCounts)
      .map(([tool, count]) => {
        const prior = priorCounts[tool] || 0;
        const trend = prior > 0 ? Math.round(((count - prior) / prior) * 100) : 100;
        return { tool, count, trend };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
