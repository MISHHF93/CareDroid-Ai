import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { stripeConfig } from '../../config/stripe.config';
import Stripe from 'stripe';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  private stripe: Stripe;

  constructor(private readonly subscriptionsService: SubscriptionsService) {
    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans() {
    return this.subscriptionsService.getSubscriptionPlans();
  }

  @Post('create-checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout session for subscription' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async createCheckoutSession(@Req() req: any, @Body() dto: CreateCheckoutDto) {
    return this.subscriptionsService.createCheckoutSession(
      req.user.id,
      dto.tier,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  @Post('portal')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create customer portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created' })
  async createPortalSession(@Req() req: any, @Body() body: { returnUrl?: string }) {
    return this.subscriptionsService.createCustomerPortalSession(req.user.id, body.returnUrl);
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription' })
  async getCurrentSubscription(@Req() req: any) {
    return this.subscriptionsService.getUserSubscription(req.user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeConfig.webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err instanceof Error ? err.message : String(err));
      return { error: 'Webhook signature verification failed' };
    }

    await this.subscriptionsService.handleWebhook(event);

    return { received: true };
  }
}
