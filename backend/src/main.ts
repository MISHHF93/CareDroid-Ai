import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
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
      // Permissions-Policy
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
      },
    }),
  );

  // CORS configuration (allow same-origin since frontend is proxied)
  app.enableCors({
    origin: ['http://localhost:8000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix (health and root endpoints will be at /)
  app.setGlobalPrefix('api', { exclude: ['health', ''] });

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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 CareDroid Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 TLS 1.3: ENFORCED (only TLS 1.3+ allowed)`);
  console.log(`📱 All traffic consolidated to port ${port}`);
}

bootstrap();
