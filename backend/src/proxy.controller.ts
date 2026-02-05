import { Controller, All, Param, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ProxyController {
  constructor(private readonly httpService: HttpService) {}

  // Proxy all monitoring and infrastructure services through port 8000

  // Grafana - /grafana/*
  @All('grafana/*')
  async proxyGrafana(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://grafana:3000', req, res);
  }

  // Kibana - /kibana/*
  @All('kibana/*')
  async proxyKibana(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://kibana:5601', req, res);
  }

  // Prometheus - /prometheus/*
  @All('prometheus/*')
  async proxyPrometheus(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://prometheus:9090', req, res);
  }

  // Alertmanager - /alertmanager/*
  @All('alertmanager/*')
  async proxyAlertmanager(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://alertmanager:9093', req, res);
  }

  // Elasticsearch - /elasticsearch/*
  @All('elasticsearch/*')
  async proxyElasticsearch(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://elasticsearch:9200', req, res);
  }

  // Sentry - /sentry/*
  @All('sentry/*')
  async proxySentry(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://sentry:9000', req, res);
  }

  // NLU Service - /nlu/*
  @All('nlu/*')
  async proxyNlu(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://nlu:8000', req, res);
  }

  // Anomaly Detection - /anomaly/*
  @All('anomaly/*')
  async proxyAnomalyDetection(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://anomaly-detection:5000', req, res);
  }

  // Logstash - /logstash/*
  @All('logstash/*')
  async proxyLogstash(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest('http://logstash:5000', req, res);
  }

  private async proxyRequest(targetBaseUrl: string, req: Request, res: Response) {
    try {
      const targetUrl = targetBaseUrl + req.url.replace(/^\/[^\/]+/, '');

      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method as any,
          url: targetUrl,
          headers: {
            ...req.headers,
            host: new URL(targetBaseUrl).host,
          },
          data: req.body,
          responseType: 'stream',
        })
      );

      // Set response headers
      Object.keys(response.headers).forEach(key => {
        if (key !== 'transfer-encoding' && key !== 'connection') {
          res.setHeader(key, response.headers[key]);
        }
      });

      // Pipe the response
      response.data.pipe(res);
    } catch (error) {
      console.error(`Proxy error for ${targetBaseUrl}:`, error instanceof Error ? error.message : String(error));
      throw new HttpException('Service temporarily unavailable', HttpStatus.BAD_GATEWAY);
    }
  }
}