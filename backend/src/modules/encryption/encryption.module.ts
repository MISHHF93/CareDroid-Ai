import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { KeyRotationService } from './key-rotation.service';
import { EncryptionKey } from './entities/encryption-key.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([EncryptionKey])],
  providers: [EncryptionService, KeyRotationService],
  exports: [EncryptionService, KeyRotationService],
})
export class EncryptionModule {}
