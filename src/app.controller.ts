import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './guards';

@ApiTags('Ping')
@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/')
  ping() {
    return this.appService.ping();
  }
}
