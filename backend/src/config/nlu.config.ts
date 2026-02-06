/**
 * NLU (Natural Language Understanding) Service Configuration
 * Configurations for the external NLU service for intent classification
 */

import { registerAs } from '@nestjs/config';

function parseIntentThresholds(raw: string | undefined): Record<string, number> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, number>>((acc, [intent, threshold]) => {
      if (typeof threshold === 'number' && threshold >= 0 && threshold <= 1) {
        acc[intent] = threshold;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export default registerAs('nlu', () => ({
  enabled: process.env.NLU_SERVICE_ENABLED !== 'false',
  url: process.env.NLU_SERVICE_URL || 'http://localhost:8000',
  timeout: parseInt(process.env.NLU_SERVICE_TIMEOUT || '30000', 10), // 30 seconds
  retries: parseInt(process.env.NLU_SERVICE_RETRIES || '3', 10),
  confidenceThreshold: parseFloat(process.env.NLU_CONFIDENCE_THRESHOLD || '0.7'),
  intentThresholds: parseIntentThresholds(process.env.NLU_INTENT_THRESHOLDS),
}));
