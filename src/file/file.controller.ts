import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';

@ApiTags('File')
@Controller('/file')
export class FileController {
  constructor(private fileService: FileService) {}

  @ApiOperation({ description: 'Upload a file to S3' })
  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.uploadFile(file);
  }
}
