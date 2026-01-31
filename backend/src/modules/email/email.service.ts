import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const emailConfig = this.configService.get('email');
      if (!emailConfig || !emailConfig.smtp) {
        this.logger.warn('Email configuration not found or incomplete. Email service disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: emailConfig.smtp.auth.user && emailConfig.smtp.auth.pass ? {
          user: emailConfig.smtp.auth.user,
          pass: emailConfig.smtp.auth.pass,
        } : undefined,
      });

      this.logger.log(`✅ Email service initialized with SMTP server: ${emailConfig.smtp.host}:${emailConfig.smtp.port}`);
    } catch (error) {
      this.logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not initialized. Email not sent.');
      return false;
    }

    try {
      const emailConfig = this.configService.get('email');
      const result = await this.transporter.sendMail({
        from: emailConfig.from.address,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`✅ Email sent to ${options.to}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string, baseUrl: string = 'http://localhost:5173'): Promise<boolean> {
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    const html = `
      <h2>Verify your email</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>Or copy this link: ${verificationLink}</p>
      <p>This link expires in 60 minutes.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify your email - CareDroid',
      html,
      text: `Verify your email: ${verificationLink}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, baseUrl: string = 'http://localhost:5173'): Promise<boolean> {
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    const html = `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>Or copy this link: ${resetLink}</p>
      <p>This link expires in 30 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset your password - CareDroid',
      html,
      text: `Reset your password: ${resetLink}`,
    });
  }

  async sendTwoFactorCode(email: string, code: string): Promise<boolean> {
    const html = `
      <h2>Two-Factor Authentication Code</h2>
      <p>Your authentication code is:</p>
      <h1 style="letter-spacing: 2px;">${code}</h1>
      <p>This code expires in 5 minutes.</p>
      <p>Do not share this code with anyone.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your two-factor authentication code - CareDroid',
      html,
      text: `Your 2FA code: ${code}`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <h2>Welcome to CareDroid!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with CareDroid Clinical Companion.</p>
      <p>Your account is now active and you can start exploring our clinical tools.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to CareDroid - CareDroid',
      html,
      text: `Welcome to CareDroid, ${name}!`,
    });
  }
}
