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

/** Camera position for 3D visualization */
interface CameraPosition3D {
  x: number;
  y: number;
  z: number;
}

/** Animation sequence step for 3D model */
interface AnimationStep3D {
  name: string;
  duration: number;
  loop?: boolean;
}

/** 3D visualization metadata returned by the API */
export interface Visualization3DMetadata {
  /** Visualization type determines which 3D component to render */
  type:
    | 'organ-model'
    | 'molecular-structure'
    | 'drug-network'
    | 'lab-chart'
    | 'timeline'
    | 'protocol';
  /** URL to the GLTF/GLB model asset (optional — uses procedural fallback if absent) */
  modelUrl?: string;
  /** Suggested initial camera position */
  cameraPosition?: CameraPosition3D;
  /** Optional animation sequence */
  animations?: AnimationStep3D[];
  /** Arbitrary structured data for the visualisation component */
  data?: Record<string, unknown>;
  /** Label to display above the 3D panel */
  label?: string;
}

interface ChatResponse3DDto {
  id: string;
  response: string;
  suggestions?: string[];
  visualizations?: Visualization3DMetadata[];
  timestamp: number;
}

interface ChatResponseDto {
  response: string;
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
  /** 3D visualization metadata for the frontend to render */
  visualizations?: Visualization3DMetadata[];
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

    // Build 3D visualization metadata from response + message context
    const rawVisualizations: Partial<Visualization3DMetadata>[] = response.visualizations ?? [];
    const visualizations: Visualization3DMetadata[] = rawVisualizations.map((v) => ({
      type: v.type ?? 'protocol',
      modelUrl: v.modelUrl,
      cameraPosition: v.cameraPosition ?? { x: 0, y: 0, z: 5 },
      animations: v.animations,
      data: v.data,
      label: v.label,
    }));

    // Auto-add organ model hint when message mentions specific anatomy
    const msgLower = dto.message.toLowerCase();
    if (!visualizations.some((v) => v.type === 'organ-model')) {
      if (/\bheart\b|cardiac|coronary/.test(msgLower)) {
        visualizations.push({
          type: 'organ-model',
          data: { organ: 'heart' },
          cameraPosition: { x: 0, y: 0, z: 3 },
          label: 'Heart',
        });
      } else if (/\bbrain\b|neuro|cerebral|stroke/.test(msgLower)) {
        visualizations.push({
          type: 'organ-model',
          data: { organ: 'brain' },
          cameraPosition: { x: 0, y: 0, z: 3 },
          label: 'Brain',
        });
      } else if (/\blung|pulmonary|respiratory/.test(msgLower)) {
        visualizations.push({
          type: 'organ-model',
          data: { organ: 'lungs' },
          cameraPosition: { x: 0, y: 0, z: 3.5 },
          label: 'Lungs',
        });
      }
    }

    // Add drug-network hint when medications are present
    if (
      dto.context?.medications?.length &&
      !visualizations.some((v) => v.type === 'drug-network')
    ) {
      visualizations.push({
        type: 'drug-network',
        data: { medications: dto.context.medications },
        cameraPosition: { x: 0, y: 0, z: 6 },
        label: 'Drug Interactions',
      });
    }

    return {
      id: `response-${Date.now()}`,
      response: response.text,
      suggestions: response.suggestions,
      visualizations,
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
      toolResult: response.toolResult,
      citations: response.citations,
      confidence: response.confidence,
      ragContext: response.ragContext,
      visualizations: (response as any).visualizations ?? [],
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
