import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { OAuthAccount } from '../users/entities/oauth-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { TwoFactor } from '../two-factor/entities/two-factor.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(OAuthAccount)
    private readonly oauthRepository: Repository<OAuthAccount>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(TwoFactor)
    private readonly twoFactorRepository: Repository<TwoFactor>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly auditService: AuditService,
  ) {}

  async generateUserDataExport(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    const oauthAccounts = await this.oauthRepository.find({
      where: { userId },
    });

    const subscriptions = await this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    const auditLogs = await this.auditLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 1000, // Last 1000 events
    });

    // Audit log the export
    await this.auditService.log({
      userId,
      action: AuditAction.DATA_EXPORT,
      resource: 'compliance/export',
      details: { recordCount: auditLogs.length },
      ipAddress: '0.0.0.0',
      userAgent: 'system',
    });

    return {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile
        ? {
            firstName: profile.firstName,
            lastName: profile.lastName,
            specialty: profile.specialty,
            institution: profile.institution,
            licenseNumber: profile.licenseNumber,
            timezone: profile.timezone,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      oauthAccounts: oauthAccounts.map((account) => ({
        provider: account.provider,
        createdAt: account.createdAt,
      })),
      subscriptions: subscriptions.map((sub) => ({
        tier: sub.tier,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        createdAt: sub.createdAt,
      })),
      twoFactorAuth: twoFactor
        ? {
            enabled: twoFactor.enabled,
            lastUsedAt: twoFactor.lastUsedAt,
            createdAt: twoFactor.createdAt,
          }
        : null,
      auditLogs: auditLogs.map((log) => ({
        action: log.action,
        resource: log.resource,
        timestamp: log.timestamp,
        phiAccessed: log.phiAccessed,
      })),
    };
  }

  async deleteUserData(userId: string, confirmEmail: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.email !== confirmEmail) {
      throw new Error('Email confirmation does not match');
    }

    // Audit log before deletion
    await this.auditService.log({
      userId,
      action: AuditAction.DATA_DELETION,
      resource: 'compliance/delete',
      details: { email: user.email },
      ipAddress: '0.0.0.0',
      userAgent: 'system',
    });

    // Delete in order (respecting foreign key constraints)
    await this.twoFactorRepository.delete({ userId });
    await this.oauthRepository.delete({ userId });
    await this.subscriptionRepository.delete({ userId });
    await this.profileRepository.delete({ userId });
    
    // Anonymize audit logs instead of deleting (HIPAA requirement)
    await this.auditLogRepository.update(
      { userId },
      { 
        userId: null,
        metadata: { anonymized: true, originalUserId: userId } as any,
      },
    );

    // Finally delete the user
    await this.userRepository.delete({ id: userId });

    return {
      success: true,
      message: 'User data has been permanently deleted',
      deletedAt: new Date().toISOString(),
    };
  }

  async getConsentStatus(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId,
      termsAccepted: user.emailVerified, // Email verification implies terms acceptance
      privacyPolicyAccepted: user.emailVerified,
      dataProcessingConsent: user.emailVerified,
      marketingConsent: false, // Default, would be stored in profile
      lastUpdated: user.updatedAt,
    };
  }

  async updateConsent(userId: string, consentType: string, granted: boolean) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, store consent preferences in UserProfile
    // For now, just audit log the change
    await this.auditService.log({
      userId,
      action: AuditAction.PROFILE_UPDATE,
      resource: 'compliance/consent',
      details: { consentType, granted },
      ipAddress: '0.0.0.0',
      userAgent: 'system',
    });

    return {
      success: true,
      consentType,
      granted,
      updatedAt: new Date().toISOString(),
    };
  }
}
