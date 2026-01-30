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
  getRoot(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  @Get('*')
  getSpaRoutes(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', '..', 'dist', 'index.html'));
  }
}
