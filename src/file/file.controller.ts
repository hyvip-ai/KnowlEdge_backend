import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
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

  @ApiOperation({ description: 'Upload a file to Supabase' })
  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Query('chatRoomId') chatRoomId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5000000 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.fileService.uploadFile(chatRoomId, file);
  }

  @ApiOperation({ description: 'Get all files for a chat room' })
  @Get('/')
  filesByChatRoom(@Query('chatRoomId') chatRoomId: string) {
    return this.fileService.filesByChatRoom(chatRoomId);
  }

  @ApiOperation({ description: 'Get signed url for a file' })
  @Post('/:fileName')
  signedUrl(
    @Query('chatRoomId') chatRoomId: string,
    @Param('fileName') fileName: string,
  ) {
    return this.fileService.signedUrl(chatRoomId, fileName);
  }

  @ApiOperation({ description: 'Delete a file' })
  @Delete('/:fileName')
  deleteFile(
    @Query('chatRoomId') chatRoomId: string,
    @Param('fileName') fileName: string,
  ) {
    return this.fileService.deleteFile(chatRoomId, fileName);
  }
}
