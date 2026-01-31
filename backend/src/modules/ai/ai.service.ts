import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionTier } from '../subscriptions/entities/subscription.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { MetricsService } from '../metrics/metrics.service';

interface RateLimitConfig {
  dailyLimit: number;
  model: string;
  maxTokens: number;
}

interface OpenaiPricing {
  inputPer1kTokens: number;
  outputPer1kTokens: number;
}

@Injectable()
export class AIService {
  private readonly openai: OpenAI;
  private readonly rateLimits: Map<SubscriptionTier, RateLimitConfig>;
  private readonly openaiPricing: Map<string, OpenaiPricing>;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
      });
    }

    // Rate limits from openai.config.ts
    this.rateLimits = new Map([
      [SubscriptionTier.FREE, { dailyLimit: 10, model: 'gpt-4o-mini', maxTokens: 1000 }],
      [SubscriptionTier.PROFESSIONAL, { dailyLimit: 1000, model: 'gpt-4o', maxTokens: 4000 }],
      [SubscriptionTier.INSTITUTIONAL, { dailyLimit: 10000, model: 'gpt-4o', maxTokens: 8000 }],
    ]);

    // OpenAI pricing (USD per 1K tokens, as of Jan 2026)
    this.openaiPricing = new Map([
      ['gpt-4o', { inputPer1kTokens: 0.03, outputPer1kTokens: 0.06 }],
      ['gpt-4o-mini', { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006 }],
    ]);
  }

  /**
   * Calculate cost in USD based on model and token usage
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.openaiPricing.get(model);
    if (!pricing) {
      return 0;
    }
    const inputCost = (inputTokens / 1000) * pricing.inputPer1kTokens;
    const outputCost = (outputTokens / 1000) * pricing.outputPer1kTokens;
    return inputCost + outputCost;
  }

  async invokeLLM(userId: string, prompt: string, context?: any) {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }
    // Get user's subscription tier
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const tier = subscription?.tier || SubscriptionTier.FREE;
    const config = this.rateLimits.get(tier);

    // Check rate limit
    const usageToday = await this.getUsageToday(userId);
    if (usageToday >= config.dailyLimit) {
      throw new Error(
        `Daily AI query limit reached (${config.dailyLimit}). Upgrade to Pro for 1000 queries/day.`,
      );
    }

    try {
      // Build messages
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are CareDroid, an AI clinical assistant. Provide evidence-based, structured medical information. Always include sources and note that this is not a substitute for professional medical advice.`,
        },
      ];

      if (context) {
        messages.push({
          role: 'system',
          content: `Context: ${JSON.stringify(context)}`,
        });
      }

      messages.push({ role: 'user', content: prompt });

      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: 0.7,
      });

      const result = {
        content: response.choices[0].message.content,
        model: config.model,
        tokensUsed: response.usage?.total_tokens || 0,
        finishReason: response.choices[0].finish_reason,
      };

      // Calculate and record cost
      const costUsd = this.calculateCost(
        config.model,
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0,
      );
      this.metricsService.recordOpenaiCost(config.model, userId, costUsd);

      // Audit log
      await this.auditService.log({
        userId,
        action: AuditAction.AI_QUERY,
        resource: 'ai/query',
        details: {
          prompt: prompt.substring(0, 100),
          model: config.model,
          tokensUsed: result.tokensUsed,
        },
        ipAddress: '0.0.0.0',
        userAgent: 'system',
      });

      return result;
    } catch (error) {
      throw new Error(`AI query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateStructuredJSON(userId: string, prompt: string, schema: any) {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }
    // Get user's subscription tier
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const tier = subscription?.tier || SubscriptionTier.FREE;
    const config = this.rateLimits.get(tier);

    // Check rate limit
    const usageToday = await this.getUsageToday(userId);
    if (usageToday >= config.dailyLimit) {
      throw new Error(
        `Daily AI query limit reached (${config.dailyLimit}). Upgrade to Pro for 1000 queries/day.`,
      );
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `You are CareDroid, an AI clinical assistant. Generate structured JSON outputs according to the provided schema. Be accurate and evidence-based.`,
          },
          {
            role: 'user',
            content: `${prompt}\n\nSchema: ${JSON.stringify(schema)}`,
          },
        ],
        max_tokens: config.maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);

      // Calculate and record cost
      const costUsd = this.calculateCost(
        config.model,
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0,
      );
      this.metricsService.recordOpenaiCost(config.model, userId, costUsd);

      // Audit log
      await this.auditService.log({
        userId,
        action: AuditAction.AI_QUERY,
        resource: 'ai/structured',
        details: {
          prompt: prompt.substring(0, 100),
          schema: Object.keys(schema),
          model: config.model,
          tokensUsed: response.usage?.total_tokens || 0,
        },
        ipAddress: '0.0.0.0',
        userAgent: 'system',
      });

      return result;
    } catch (error) {
      throw new Error(`Structured JSON generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getUsage(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // This would query an ai_queries table in a real implementation
    // For now, return mock data from audit logs
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const tier = subscription?.tier || SubscriptionTier.FREE;
    const config = this.rateLimits.get(tier);

    return {
      userId,
      tier,
      dailyLimit: config.dailyLimit,
      usedToday: await this.getUsageToday(userId),
      usedThisMonth: 0, // Would query ai_queries table
      totalCost: 0, // Would calculate from ai_queries table
    };
  }

  private async getUsageToday(userId: string): Promise<number> {
    // In a real implementation, this would query an ai_queries table
    // For now, return 0 to allow testing
    return 0;
  }
}
