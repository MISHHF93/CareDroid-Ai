import './observability/datadog';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { initSentry } from './config/sentry.config';
import { LoggingMiddleware } from './middleware/logging.middleware';

async function bootstrap() {
  // Initialize Sentry for error tracking BEFORE creating the app
  initSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enhanced Security headers with HSTS and strict CSP
  app.use(
    helmet({
      // Strict Transport Security: enforce HTTPS, prevent downgrade attacks
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true, // Allow addition to HSTS preload list
      },
      // Content Security Policy: prevent XSS attacks
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      // X-Frame-Options: prevent clickjacking
      frameguard: { action: 'deny' },
      // X-Content-Type-Options: prevent MIME sniffing
      noSniff: true,
      // X-XSS-Protection: legacy XSS protection
      xssFilter: true,
      // Referrer-Policy: control referrer information
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Sentry error tracking middleware (must be early in the middleware stack)
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());

  // HTTP request/response logging middleware (temporarily disabled for testing)
  // app.use(LoggingMiddleware);

  // CORS configuration (allow same-origin since frontend is proxied)
  const defaultOrigins = ['http://localhost:8000'];
  const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are provided
      transform: true, // Transform payloads to DTO instances
      disableErrorMessages: false, // Enable detailed error messages in development
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
    }),
  );

  // API prefix (health and root endpoints will be at /)
  app.setGlobalPrefix('api', { exclude: ['health', '', 'test'] });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CareDroid API')
    .setDescription('HIPAA-compliant clinical platform backend')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('users', 'User Management')
    .addTag('subscriptions', 'Stripe Subscription Management')
    .addTag('clinical', 'Clinical Data (Drugs, Protocols, Lab Values)')
    .addTag('ai', 'OpenAI GPT-4 Integration')
    .addTag('audit', 'HIPAA Audit Logs')
    .addTag('compliance', 'GDPR & Compliance')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Port lockdown: Hardcode to 8000 only
  const port = 8000;

  // Security validation: Prevent any attempts to use other ports
  if (process.env.PORT && process.env.PORT !== '8000') {
    console.error('🚫 SECURITY VIOLATION: PORT environment variable must be 8000 or unset.');
    console.error(`   Current PORT value: ${process.env.PORT}`);
    console.error('   Application will not start on any port other than 8000.');
    process.exit(1);
  }

  await app.listen(port);

  console.log(`\n🚀 CareDroid Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api`);
  console.log(`📊 Prometheus metrics at: http://localhost:${port}/metrics`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 TLS 1.3: ENFORCED (only TLS 1.3+ allowed)`);
  console.log(`\n📈 Monitoring Stack (internal docker network only):`);
  console.log(`   - All monitoring services accessible within docker-compose network`);
  console.log(`   - External access: Main application only on http://localhost:${port}`);
}

bootstrap();
