import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatDTO } from './dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ChatService {
  constructor(private common: CommonService) {}

  async chat(data: ChatDTO) {
    try {
      const res = await this.common.generateAIResponse({
        question: data.question,
      });
      return { data: res, message: 'SUCCESS', statusCode: 200 };
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.message);
    }
  }
}
