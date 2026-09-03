import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Health check: intencionalmente público, para que un load balancer /
  // orquestador pueda verificar liveness sin credenciales.
  @Public()
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
