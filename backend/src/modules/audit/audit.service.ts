import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  public readonly events = new EventEmitter();

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  /**
   * Calculate SHA-256 hash of an audit log entry
   * This is used for creating immutable chain of audit logs
   */
  private calculateHash(data: {
    userId?: string;
    action: AuditAction;
    resource: string;
    ipAddress: string;
    timestamp: Date;
    previousHash?: string;
    metadata?: Record<string, any>;
  }): string {
    const content = JSON.stringify({
      ...data,
      previousHash: data.previousHash || '0', // First entry has '0' as previous hash
    });
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Log an audit entry with hash chaining for integrity verification
   */
  async log(data: {
    userId?: string;
    action: AuditAction;
    resource: string;
    ipAddress: string;
    userAgent: string;
    phiAccessed?: boolean;
    metadata?: Record<string, any>;
    details?: Record<string, any>;
  }) {
    const timestamp = new Date();

    // Get the last audit log to get its hash for chaining
    const lastLogs = await this.auditRepository.find({
      order: { timestamp: 'DESC' },
      take: 1,
    });
    const lastLog = lastLogs[0];

    const previousHash = lastLog?.hash || '0'; // Genesis block uses '0'

    // Calculate hash for this entry
    const hash = this.calculateHash({
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      ipAddress: data.ipAddress,
      timestamp,
      previousHash,
      metadata: data.metadata,
    });

    const auditLog = this.auditRepository.create({
      ...data,
      timestamp,
      hash,
      previousHash,
      integrityVerified: true, // Assume valid when first created
    });

    const saved = await this.auditRepository.save(auditLog);

    // Emit for SSE real-time streaming
    try {
      this.events.emit('audit:new', {
        id: saved.id,
        action: saved.action,
        userId: saved.userId,
        resource: saved.resource,
        timestamp: saved.timestamp,
        phiAccessed: saved.phiAccessed || false,
        integrityVerified: saved.integrityVerified,
      });
    } catch (e) {
      this.logger.warn('Failed to emit audit:new event', e);
    }

    return saved;
  }

  /**
   * Verify the integrity of the entire audit log chain
   * Returns true if all hashes match correctly, false if tampering detected
   */
  async verifyIntegrity(): Promise<{
    isValid: boolean;
    totalLogs: number;
    tamperedLogs: string[];
    message: string;
  }> {
    const allLogs = await this.auditRepository.find({
      order: { timestamp: 'ASC' },
    });

    if (allLogs.length === 0) {
      return {
        isValid: true,
        totalLogs: 0,
        tamperedLogs: [],
        message: 'No audit logs to verify',
      };
    }

    const tamperedLogs: string[] = [];
    let previousHash = '0'; // Genesis block

    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];

      // Recalculate the expected hash
      const expectedHash = this.calculateHash({
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
        previousHash,
        metadata: log.metadata,
      });

      // Verify hash matches
      if (log.hash !== expectedHash) {
        tamperedLogs.push(
          `Log ID ${log.id}: Hash mismatch (expected ${expectedHash}, got ${log.hash})`,
        );
      }

      // Verify chain is intact
      if (log.previousHash !== previousHash) {
        tamperedLogs.push(
          `Log ID ${log.id}: Chain broken (expected previousHash ${previousHash}, got ${log.previousHash})`,
        );
      }

      previousHash = log.hash;
    }

    const isValid = tamperedLogs.length === 0;

    // Update integrityVerified flag for all logs
    if (isValid) {
      await this.auditRepository.update({}, { integrityVerified: true });
    } else {
      // Mark all logs as unverified if chain is broken
      await this.auditRepository.update({}, { integrityVerified: false });
    }

    return {
      isValid,
      totalLogs: allLogs.length,
      tamperedLogs,
      message: isValid
        ? 'All audit logs verified successfully'
        : `Tampering detected in ${tamperedLogs.length} logs`,
    };
  }

  async findByUser(userId: string, limit = 100) {
    return this.auditRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findPhiAccess(startDate: Date, endDate: Date) {
    return this.auditRepository
      .createQueryBuilder('log')
      .where('log.phiAccessed = :phi', { phi: true })
      .andWhere('log.timestamp >= :startDate', { startDate })
      .andWhere('log.timestamp <= :endDate', { endDate })
      .orderBy('log.timestamp', 'DESC')
      .getMany();
  }

  /**
   * Find all logs with optional filters and cursor-based pagination
   */
  async findAll(filters: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    phiOnly?: boolean;
    cursor?: string;
    limit?: number;
  } = {}): Promise<{ logs: AuditLog[]; nextCursor: string | null; total: number }> {
    const limit = filters.limit || 50;
    const qb = this.auditRepository.createQueryBuilder('log');

    if (filters.userId) {
      qb.andWhere('log.userId = :userId', { userId: filters.userId });
    }
    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.startDate) {
      qb.andWhere('log.timestamp >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('log.timestamp <= :endDate', { endDate: filters.endDate });
    }
    if (filters.phiOnly) {
      qb.andWhere('log.phiAccessed = :phi', { phi: true });
    }
    if (filters.search) {
      qb.andWhere('(log.resource LIKE :search)', { search: `%${filters.search}%` });
    }
    if (filters.cursor) {
      // Cursor is the timestamp of the last item
      qb.andWhere('log.timestamp < :cursor', { cursor: new Date(filters.cursor) });
    }

    const total = await qb.clone().getCount();
    const logs = await qb
      .orderBy('log.timestamp', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = logs.length > limit;
    if (hasMore) logs.pop();

    const nextCursor = hasMore && logs.length > 0
      ? logs[logs.length - 1].timestamp.toISOString()
      : null;

    return { logs, nextCursor, total };
  }

  /**
   * Find all logs by action type
   */
  async findByAction(action: AuditAction, limit = 100) {
    return this.auditRepository.find({
      where: { action },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find all logs within a date range
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    return this.auditRepository
      .createQueryBuilder('log')
      .where('log.timestamp >= :startDate', { startDate })
      .andWhere('log.timestamp <= :endDate', { endDate })
      .orderBy('log.timestamp', 'DESC')
      .getMany();
  }

  /**
   * Find logs by user within date range
   */
  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.auditRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.timestamp >= :startDate', { startDate })
      .andWhere('log.timestamp <= :endDate', { endDate })
      .orderBy('log.timestamp', 'DESC')
      .getMany();
  }
}
