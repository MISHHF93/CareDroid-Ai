import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { AuthorizationGuard } from '../auth/guards/authorization.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';
import { MedicalSource } from '../rag/dto/medical-source.dto';

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
    type:
      | 'drug-interaction'
      | 'calculator'
      | 'protocol'
      | 'lab-order'
      | 'anatomy-3d'
      | 'drug-network-3d'
      | 'lab-chart-3d'
      | 'timeline-3d';
    data: any;
    metadata?: {
      modelUrl?: string;
      camera?: { position: [number, number, number]; fov: number };
      animation?: string[];
      lod?: 'high' | 'medium' | 'low';
    };
  }[];
  timestamp: number;
}

interface ChatResponseDto {
  response: string;
  visualizations?: ChatResponse3DDto['visualizations'];
  toolResult?: {
    toolName: string;
    toolId?: string;
    parameters: any;
    result?: any;
    displayFormat?: string;
  };
  citations?: MedicalSource[];
  confidence?: number;
  ragContext?: {
    chunksRetrieved: number;
    sourcesFound: number;
  };
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

  private enrichVisualizations(message: string, visualizations: any[] = []): ChatResponse3DDto['visualizations'] {
    const lower = (message || '').toLowerCase();
    const base = visualizations.map((viz) => ({
      ...viz,
      metadata: {
        camera: viz?.metadata?.camera || { position: [0, 1.2, 5.2], fov: 52 },
        animation: viz?.metadata?.animation || ['pulse'],
        lod: viz?.metadata?.lod || 'medium',
        modelUrl: viz?.metadata?.modelUrl,
      },
    }));

    if (/(heart|brain|lung|anatomy|organ)/.test(lower)) {
      base.push({
        type: 'anatomy-3d',
        data: {
          organ: lower.includes('heart') ? 'heart' : lower.includes('brain') ? 'brain' : lower.includes('lung') ? 'lungs' : 'general',
          vitals: { HR: 90, SpO2: '96%', RR: 20 },
        },
        metadata: {
          camera: { position: [0, 1.4, 5], fov: 50 },
          animation: ['rotate', 'scan'],
          lod: 'high',
        },
      });
    }

    if (/(drug|interaction|medication)/.test(lower)) {
      base.push({
        type: 'drug-network-3d',
        data: { nodes: [], links: [] },
        metadata: {
          camera: { position: [0, 1.1, 5.8], fov: 53 },
          animation: ['orbit'],
          lod: 'medium',
        },
      });
    }

    if (/(lab|trend|timeline|history)/.test(lower)) {
      base.push({
        type: 'timeline-3d',
        data: { events: [] },
        metadata: {
          camera: { position: [0, 0.8, 6.4], fov: 54 },
          animation: ['flow'],
          lod: 'low',
        },
      });
    }

    return base;
  }

  @Post('message-3d')
  @RequirePermission(Permission.READ_PHI)
  async sendMessage3D(@Body() dto: ChatMessage3DDto): Promise<ChatResponse3DDto> {
    const response = await this.chatService.processQuery(dto.patientId, dto.message, dto.context);

    return {
      id: `response-${Date.now()}`,
      response: response.text,
      suggestions: response.suggestions,
      visualizations: this.enrichVisualizations(dto.message, response.visualizations),
      timestamp: Date.now(),
    };
  }

  @Post('message')
  @RequirePermission(Permission.USE_AI_CHAT)
  async sendMessage(@Body() dto: ChatMessageDto, @Req() req?: any): Promise<ChatResponseDto> {
    // Extract userId and role from request if authenticated
    const userId = req?.user?.id || 'anonymous';
    const userRole = req?.user?.role || null;
    
    const response = await this.chatService.processMessage(
      dto.message,
      dto.tool,
      dto.feature,
      dto.conversationId,
      userId,
      userRole,
    );

    return {
      response: response.text,
      visualizations: this.enrichVisualizations(dto.message, response.visualizations),
      toolResult: response.toolResult,
      citations: response.citations,
      confidence: response.confidence,
      ragContext: response.ragContext,
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
