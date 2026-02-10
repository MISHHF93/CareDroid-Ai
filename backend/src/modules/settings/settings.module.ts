import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { UserSettings, SettingsActivityLog } from './entities/user-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSettings, SettingsActivityLog])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
