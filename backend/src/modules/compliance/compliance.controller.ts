import { Controller, Get, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ComplianceService } from './compliance.service';
import { DeleteAccountDto, UpdateConsentDto } from './dto/compliance.dto';

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('export')
  @ApiOperation({ summary: 'Export all user data (GDPR)' })
  @ApiResponse({ status: 200, description: 'Data export generated' })
  async exportData(@Req() req: any) {
    return this.complianceService.generateUserDataExport(req.user.id);
  }

  @Delete('delete-account')
  @ApiOperation({ summary: 'Delete account and all data (Right to be forgotten)' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(@Req() req: any, @Body() dto: DeleteAccountDto) {
    return this.complianceService.deleteUserData(req.user.id, dto.confirmEmail);
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get consent status' })
  @ApiResponse({ status: 200, description: 'Consent status' })
  async getConsent(@Req() req: any) {
    return this.complianceService.getConsentStatus(req.user.id);
  }

  @Post('consent')
  @ApiOperation({ summary: 'Update consent preferences' })
  @ApiResponse({ status: 200, description: 'Consent updated' })
  async updateConsent(@Req() req: any, @Body() dto: UpdateConsentDto) {
    return this.complianceService.updateConsent(req.user.id, dto.consentType, dto.granted);
  }
}
