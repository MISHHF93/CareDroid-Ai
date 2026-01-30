import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionService } from './encryption.service';
import { KeyRotationService } from './key-rotation.service';
import { EncryptionKey } from './entities/encryption-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EncryptionKey])],
  providers: [EncryptionService, KeyRotationService],
  exports: [EncryptionService, KeyRotationService],
})
export class EncryptionModule {}
