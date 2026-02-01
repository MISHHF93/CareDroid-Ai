import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AIService } from './ai.service';
import { AIQueryDto, StructuredJSONDto } from './dto/ai.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('query')
  @ApiOperation({ summary: 'Query GPT-4 for clinical assistance' })
  @ApiResponse({ status: 200, description: 'AI response generated' })
  async query(@Req() req: any, @Body() dto: AIQueryDto) {
    return this.aiService.invokeLLM(req.user.id, dto.prompt, dto.context);
  }

  @Post('structured')
  @ApiOperation({ summary: 'Generate structured JSON clinical output' })
  @ApiResponse({ status: 200, description: 'Structured JSON generated' })
  async generateStructured(@Req() req: any, @Body() dto: StructuredJSONDto) {
    return this.aiService.generateStructuredJSON(req.user.id, dto.prompt, dto.schema);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getUsage(@Req() req: any, @Query('days') days?: number) {
    return this.aiService.getUsage(req.user.id, days ? parseInt(days.toString(), 10) : 30);
  }

  @Get('remaining-queries')
  @ApiOperation({ summary: 'Get remaining AI queries for current subscription tier' })
  @ApiResponse({ status: 200, description: 'Remaining queries count' })
  async getRemainingQueries(@Req() req: any) {
    return this.aiService.getRemainingQueries(req.user.id);
  }
}
