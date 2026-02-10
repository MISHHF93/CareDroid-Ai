import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { EventEmitter } from 'events';
import { User, UserRole } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  public readonly events = new EventEmitter();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    private readonly auditService: AuditService,
  ) {}

  async findById(id: string, requestingUserId?: string, ipAddress = '0.0.0.0', userAgent = 'system') {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'subscription'],
    });

    // Log profile access (PHI)
    if (requestingUserId && user) {
      await this.auditService.log({
        userId: requestingUserId,
        action: AuditAction.PHI_ACCESS,
        resource: `user/${id}/profile`,
        ipAddress,
        userAgent,
        phiAccessed: true,
        metadata: {
          accessType: 'profile_read',
          targetUserId: id,
          includedRelations: ['profile', 'subscription'],
        },
      });
    }

    return user;
  }

  async findByEmail(email: string, requestingUserId?: string, ipAddress = '0.0.0.0', userAgent = 'system') {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'subscription'],
    });

    // Log profile access (PHI)
    if (requestingUserId && user) {
      await this.auditService.log({
        userId: requestingUserId,
        action: AuditAction.PHI_ACCESS,
        resource: `user/email-lookup`,
        ipAddress,
        userAgent,
        phiAccessed: true,
        metadata: {
          accessType: 'email_lookup',
          foundUserId: user.id,
        },
      });
    }

    return user;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>, requestingUserId?: string, ipAddress = '0.0.0.0', userAgent = 'system') {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new Error('Profile not found');
    }

    const oldValues = { ...profile };
    Object.assign(profile, updates);
    const savedProfile = await this.profileRepository.save(profile);

    // Log profile modification (PHI)
    if (requestingUserId) {
      await this.auditService.log({
        userId: requestingUserId,
        action: AuditAction.PROFILE_UPDATE,
        resource: `user/${userId}/profile`,
        ipAddress,
        userAgent,
        phiAccessed: true,
        metadata: {
          modifiedFields: Object.keys(updates),
          changes: Object.entries(updates).map(([key, newValue]) => ({
            field: key,
            oldValue: oldValues[key],
            newValue,
          })),
        },
      });
    }

    return savedProfile;
  }

  // ═══════════════════════════════════════════
  // TEAM MANAGEMENT METHODS
  // ═══════════════════════════════════════════

  /**
   * List all users with optional filters (for team management)
   */
  async findAll(filters?: { role?: string; status?: string; search?: string }) {
    this.logger.log(`Fetching all users with filters: ${JSON.stringify(filters || {})}`);
    const qb = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile');

    if (filters?.role) {
      qb.andWhere('user.role = :role', { role: filters.role });
    }
    if (filters?.status === 'active') {
      qb.andWhere('user.isActive = :active', { active: true });
    } else if (filters?.status === 'inactive') {
      qb.andWhere('user.isActive = :active', { active: false });
    }
    if (filters?.search) {
      qb.andWhere('(user.email LIKE :s OR profile.fullName LIKE :s OR profile.firstName LIKE :s OR profile.lastName LIKE :s)', { s: `%${filters.search}%` });
    }

    qb.orderBy('user.createdAt', 'DESC');
    const users = await qb.getMany();

    // Return safe projection (no password hashes, encrypted blobs, etc.)
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      createdAt: u.createdAt,
      profile: u.profile ? {
        fullName: u.profile.fullName,
        firstName: u.profile.firstName,
        lastName: u.profile.lastName,
        specialty: u.profile.specialty,
        institution: u.profile.institution,
        avatarUrl: u.profile.avatarUrl,
        verified: u.profile.verified,
        trustScore: u.profile.trustScore,
        country: u.profile.country,
        timezone: u.profile.timezone,
        licenseNumber: u.profile.licenseNumber,
      } : null,
    }));
  }

  /**
   * Get a single user by ID (admin view — full profile without sensitive blobs)
   */
  async findUserById(id: string, requestingUserId?: string, ipAddress = '0.0.0.0', userAgent = 'system') {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });

    if (!user) return null;

    if (requestingUserId) {
      await this.auditService.log({
        userId: requestingUserId,
        action: AuditAction.PHI_ACCESS,
        resource: `user/${id}/admin-view`,
        ipAddress,
        userAgent,
        phiAccessed: true,
        metadata: { accessType: 'admin_profile_view', targetUserId: id },
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      createdAt: user.createdAt,
      profile: user.profile ? {
        fullName: user.profile.fullName,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        specialty: user.profile.specialty,
        institution: user.profile.institution,
        avatarUrl: user.profile.avatarUrl,
        verified: user.profile.verified,
        trustScore: user.profile.trustScore,
        country: user.profile.country,
        timezone: user.profile.timezone,
        licenseNumber: user.profile.licenseNumber,
        languagePreference: user.profile.languagePreference,
      } : null,
    };
  }

  /**
   * Update a user's role (admin action)
   */
  async updateRole(userId: string, newRole: UserRole, adminId: string, ipAddress = '0.0.0.0', userAgent = 'system') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const oldRole = user.role;
    user.role = newRole;
    await this.userRepository.save(user);

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.PERMISSION_GRANTED,
      resource: `user/${userId}/role`,
      ipAddress,
      userAgent,
      phiAccessed: false,
      metadata: { targetUserId: userId, oldRole, newRole, action: 'role_change' },
    });

    this.logger.log(`Role changed for user ${userId}: ${oldRole} → ${newRole} by admin ${adminId}`);
    this.events.emit('team:presence', { type: 'role-changed', userId, role: newRole });

    return { id: userId, role: newRole, previousRole: oldRole };
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivateUser(userId: string, adminId: string, ipAddress = '0.0.0.0', userAgent = 'system') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    user.isActive = false;
    await this.userRepository.save(user);

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.SECURITY_EVENT,
      resource: `user/${userId}/deactivate`,
      ipAddress,
      userAgent,
      phiAccessed: false,
      metadata: { targetUserId: userId, action: 'deactivate' },
    });

    this.logger.log(`User ${userId} deactivated by admin ${adminId}`);
    this.events.emit('team:presence', { type: 'deactivated', userId });

    return { id: userId, isActive: false };
  }

  /**
   * Reactivate a user
   */
  async reactivateUser(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    user.isActive = true;
    await this.userRepository.save(user);

    this.logger.log(`User ${userId} reactivated by admin ${adminId}`);
    this.events.emit('team:presence', { type: 'reactivated', userId });
    return { id: userId, isActive: true };
  }

  /**
   * Get aggregate team stats
   */
  async getTeamStats() {
    const users = await this.userRepository.find({ relations: ['profile'] });

    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    const byRole: Record<string, number> = {};
    for (const u of users) {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    }
    const verified = users.filter((u) => u.profile?.verified).length;
    const recentLogins = users
      .filter((u) => u.lastLoginAt && (Date.now() - new Date(u.lastLoginAt).getTime()) < 24 * 3600000)
      .length;

    return { total, active, inactive, byRole, verified, recentLogins };
  }

  /**
   * Create an invitation (stores pending invite)
   */
  async createInvitation(email: string, role: UserRole, invitedBy: string) {
    // In a real system this would store an invitation record and send an email
    // For now, create a user with isActive=false as a pending invitation
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new Error('A user with this email already exists');
    }

    const user = this.userRepository.create({
      email,
      role,
      isActive: false,
      emailVerified: false,
    });
    const saved = await this.userRepository.save(user);

    // Create empty profile
    const profile = this.profileRepository.create({ userId: saved.id });
    await this.profileRepository.save(profile);

    this.logger.log(`Invitation created for ${email} as ${role} by ${invitedBy}`);

    await this.auditService.log({
      userId: invitedBy,
      action: AuditAction.SECURITY_EVENT,
      resource: `user/${saved.id}/invite`,
      ipAddress: '0.0.0.0',
      userAgent: 'system',
      phiAccessed: false,
      metadata: { email, role, action: 'invite' },
    });

    return { id: saved.id, email, role, status: 'pending' };
  }
}

