import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

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
    const auditLog = this.auditRepository.create({
      ...data,
      timestamp: new Date(),
    });

    return this.auditRepository.save(auditLog);
  }

  async findByUser(userId: string, limit = 100) {
    return this.auditRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findPhiAccess(startDate: Date, endDate: Date) {
    return this.auditRepository.find({
      where: {
        phiAccessed: true,
      },
      order: { timestamp: 'DESC' },
    });
  }
}
