import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, ImportSettingsDto } from './dto/update-settings.dto';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get current user's app settings.
   */
  @Get()
  @ApiOperation({ summary: 'Get user app settings' })
  @ApiResponse({ status: 200, description: 'User settings returned' })
  async getSettings(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const settings = await this.settingsService.getSettings(userId);
    return { settings };
  }

  /**
   * Update user app settings (partial merge).
   */
  @Patch()
  @ApiOperation({ summary: 'Update user app settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const meta = {
      ip: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
      userAgent: req.headers?.['user-agent'] || '',
    };
    const settings = await this.settingsService.updateSettings(userId, dto, meta);
    return { settings };
  }

  /**
   * Reset settings to defaults.
   */
  @Delete('reset')
  @ApiOperation({ summary: 'Reset settings to defaults' })
  @ApiResponse({ status: 200, description: 'Settings reset to defaults' })
  async resetSettings(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const meta = {
      ip: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
      userAgent: req.headers?.['user-agent'] || '',
    };
    const settings = await this.settingsService.resetSettings(userId, meta);
    return { settings, message: 'Settings reset to defaults' };
  }

  /**
   * Get user's data storage statistics.
   */
  @Get('storage')
  @ApiOperation({ summary: 'Get data storage stats for user' })
  @ApiResponse({ status: 200, description: 'Storage stats returned' })
  async getStorageStats(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const stats = await this.settingsService.getStorageStats(userId);
    return { stats };
  }

  /**
   * Queue a full data export for the user.
   */
  @Post('export')
  @ApiOperation({ summary: 'Queue data export' })
  @ApiResponse({ status: 200, description: 'Data export queued' })
  async exportData(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const result = await this.settingsService.exportUserData(userId);
    return result;
  }

  /**
   * Export settings as JSON (for import on another device).
   */
  @Get('export-json')
  @ApiOperation({ summary: 'Export settings as JSON' })
  @ApiResponse({ status: 200, description: 'Settings JSON returned' })
  async exportSettingsJson(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const meta = {
      ip: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
      userAgent: req.headers?.['user-agent'] || '',
    };
    const exported = await this.settingsService.exportSettings(userId, meta);
    return { settings: exported };
  }

  /**
   * Import settings from JSON.
   */
  @Post('import')
  @ApiOperation({ summary: 'Import settings from JSON' })
  @ApiResponse({ status: 200, description: 'Settings imported' })
  async importSettings(@Req() req: any, @Body() dto: ImportSettingsDto) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const meta = {
      ip: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
      userAgent: req.headers?.['user-agent'] || '',
    };
    const settings = await this.settingsService.importSettings(userId, dto as any, meta);
    return { settings, message: 'Settings imported successfully' };
  }

  /**
   * Get recent activity log for settings changes.
   */
  @Get('activity')
  @ApiOperation({ summary: 'Get settings activity log' })
  @ApiResponse({ status: 200, description: 'Activity log returned' })
  async getActivityLog(@Req() req: any, @Query('limit') limit?: number) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const activities = await this.settingsService.getActivityLog(userId, limit || 20);
    return { activities };
  }

  /**
   * Get active sessions.
   */
  @Get('sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({ status: 200, description: 'Sessions returned' })
  async getSessions(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const ua = req.headers?.['user-agent'] || '';
    const sessions = this.settingsService.getActiveSessions(userId, ua);
    return { sessions };
  }

  /**
   * Revoke a session.
   */
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke a session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(@Req() req: any, @Param('id') sessionId: string) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const success = this.settingsService.revokeSession(userId, sessionId);
    return { success, message: success ? 'Session revoked' : 'Cannot revoke current session' };
  }
}
