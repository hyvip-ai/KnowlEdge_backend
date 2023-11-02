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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { RolesGuard } from 'src/guards';
import { Role } from '@prisma/client';
import { Roles } from 'src/decorators';

@ApiTags('File')
@Controller('/file')
export class FileController {
  constructor(private fileService: FileService) {}

  @ApiOperation({ description: 'Upload a file to Supabase' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('/:fileName')
  deleteFile(
    @Query('chatRoomId') chatRoomId: string,
    @Param('fileName') fileName: string,
  ) {
    return this.fileService.deleteFile(chatRoomId, fileName);
  }
}
