import { registerAs } from '@nestjs/config';

export default registerAs('encryption', () => ({
  algorithm: 'aes-256-gcm',
  key: process.env.ENCRYPTION_KEY || 'CHANGE_ME_32_CHARACTER_KEY_NOW!',
  ivLength: 16,
  saltLength: 64,
  tagLength: 16,
}));

// Fields that require encryption at rest (PII/PHI)
export const encryptedFields = {
  user: ['email'],
  userProfile: ['fullName', 'institution', 'licenseNumber'],
  auditLog: ['ipAddress', 'userAgent'],
};
