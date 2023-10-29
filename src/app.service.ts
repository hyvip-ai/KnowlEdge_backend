import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ping() {
    return { data: 'KnowlEdge V1.0.0', messgae: 'SUCCESS', statusCode: 200 };
  }
}
