import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { AuthorizationGuard } from '../auth/guards/authorization.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';

interface ChatMessage3DDto {
  patientId: string;
  message: string;
  context?: {
    vitals?: Record<string, any>;
    medications?: string[];
    activeProblems?: string[];
  };
}

interface ChatMessageDto {
  message: string;
  tool?: string;
  feature?: string;
  conversationId?: number;
}

interface ChatResponse3DDto {
  id: string;
  response: string;
  suggestions?: string[];
  visualizations?: {
    type: 'drug-interaction' | 'calculator' | 'protocol' | 'lab-order';
    data: any;
  }[];
  timestamp: number;
}

interface ChatResponseDto {
  response: string;
  metadata: {
    toolUsed?: string;
    featureUsed?: string;
    conversationId?: number;
    timestamp: number;
    intentClassification?: any;
    emergencyAlert?: any;
  };
}

@Controller('chat')
@UseGuards(AuthGuard('jwt'), AuthorizationGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('message-3d')
  @RequirePermission(Permission.READ_PHI)
  async sendMessage3D(@Body() dto: ChatMessage3DDto): Promise<ChatResponse3DDto> {
    const response = await this.chatService.processQuery(dto.patientId, dto.message, dto.context);

    return {
      id: `response-${Date.now()}`,
      response: response.text,
      suggestions: response.suggestions,
      visualizations: response.visualizations,
      timestamp: Date.now(),
    };
  }

  @Post('message')
  @RequirePermission(Permission.USE_AI_CHAT)
  async sendMessage(@Body() dto: ChatMessageDto, @Req() req?: any): Promise<ChatResponseDto> {
    // Extract userId from request if authenticated
    const userId = req?.user?.id || 'anonymous';
    
    const response = await this.chatService.processMessage(
      dto.message,
      dto.tool,
      dto.feature,
      dto.conversationId,
      userId,
    );

    return {
      response: response.text,
      metadata: {
        toolUsed: dto.tool,
        featureUsed: dto.feature,
        conversationId: dto.conversationId,
        timestamp: Date.now(),
        intentClassification: response.intentClassification,
        emergencyAlert: response.emergencyAlert,
      },
    };
  }

  @Post('suggest-action')
  @RequirePermission(Permission.READ_PHI)
  async suggestAction(@Body() body: { patientId: string; context: any }): Promise<any> {
    return this.chatService.suggestNextAction(body.patientId, body.context);
  }

  @Post('analyze-vitals')
  @RequirePermission(Permission.USE_CALCULATORS)
  async analyzeVitals(@Body() body: { vitals: Record<string, any> }): Promise<any> {
    return this.chatService.analyzeVitals(body.vitals);
  }
}
