import { Controller, Get, Patch, Delete, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { AuthorizationGuard } from '../auth/guards/authorization.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), AuthorizationGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ═══ Self-service profile endpoints ═══

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @RequirePermission(Permission.READ_PHI)
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @RequirePermission(Permission.WRITE_PHI)
  async updateProfile(@Req() req: any, @Body() updates: any) {
    return this.usersService.updateProfile(req.user.id, updates);
  }

  // ═══ Team management endpoints (admin) ═══

  @Get()
  @ApiOperation({ summary: 'List all users (team management)' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @RequirePermission(Permission.MANAGE_USERS)
  async listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ role, status, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get team statistics' })
  @RequirePermission(Permission.MANAGE_USERS)
  async getTeamStats() {
    return this.usersService.getTeamStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin view)' })
  @RequirePermission(Permission.MANAGE_USERS)
  async getUserById(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findUserById(id, req.user.id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role' })
  @RequirePermission(Permission.MANAGE_ROLES)
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Req() req: any,
  ) {
    return this.usersService.updateRole(id, role, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  @RequirePermission(Permission.MANAGE_USERS)
  async deactivateUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.deactivateUser(id, req.user.id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a deactivated user' })
  @RequirePermission(Permission.MANAGE_USERS)
  async reactivateUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.reactivateUser(id, req.user.id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new team member' })
  @RequirePermission(Permission.MANAGE_USERS)
  async inviteUser(@Body() body: { email: string; role?: string }, @Req() req: any) {
    const role = (body.role as UserRole) || UserRole.STUDENT;
    return this.usersService.createInvitation(body.email, role, req.user.id);
  }
}
