import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  async uploadFile(file: Express.Multer.File) {
    return null;
  }
}
