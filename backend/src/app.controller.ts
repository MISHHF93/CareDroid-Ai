import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'CareDroid API',
      version: '1.0.0',
    };
  }

  @Get()
  getRoot() {
    return {
      message: 'CareDroid API',
      version: '1.0.0',
      docs: '/api',
    };
  }

  // Frontend SPA routes (temporarily disabled for API testing)
  // @Get('*')
  // getSpaRoutes(@Res() res: Response) {
  //   return res.sendFile(join(__dirname, '..', '..', 'dist', 'index.html'));
  // }
}
