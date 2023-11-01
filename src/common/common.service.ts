import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as argon2 from 'argon2';
import { Document } from 'langchain/dist/document';
import { WebPDFLoader } from 'langchain/document_loaders/web/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

@Injectable()
export class CommonService {
  constructor(private config: ConfigService) {}

  private supabaseClient: SupabaseClient;
  private pineconeClient: Pinecone;

  private STANDALONE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

  private QA_TEMPLATE = `You are an enthusiastic AI assistant or a tool.Tools makes mistakes, but they also learn from them. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.I repeat do not try to make up something.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`;

  hashData(password: string) {
    return argon2.hash(password);
  }

  generateErrorResponse(err: any, entity: string) {
    console.log(err);
    if (err?.code === 'P2025') {
      throw new BadRequestException(`${entity} not found`);
    } else if (err?.code === 'P2002' || err.response?.status === 409) {
      throw new ConflictException(`${entity} already exist`);
    }
    throw new InternalServerErrorException('Something went wrong');
  }

  customToken() {
    const bufferValue = Buffer.alloc(64);
    for (let i = 0; i < bufferValue.length; i++) {
      bufferValue[i] = Math.floor(Math.random() * 256);
    }
    const token = bufferValue.toString('base64');
    return token;
  }

  getSupabaseClient() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }

    this.supabaseClient = createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_ANON_KEY'),
    );

    return this.supabaseClient;
  }

  getPineconeClient() {
    if (this.pineconeClient) {
      return this.pineconeClient;
    }
    this.pineconeClient = new Pinecone({
      apiKey: this.config.get('PINECONE_APIKEY'),
      environment: this.config.get('PINECONE_ENVIRONMENT'),
    });

    return this.pineconeClient;
  }

  async getChunkedDocsFromPDF(pdfPaths: string[]) {
    try {
      const allChunkedDocs: Document<Record<string, any>>[] = [];
      for (const pdfPath of pdfPaths) {
        const pdfBlob = await fetch(pdfPath).then((res) => res.blob());
        const loader = new WebPDFLoader(pdfBlob);
        const docs = await loader.load();

        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        const chunkedDocs = await textSplitter.splitDocuments(docs);
        allChunkedDocs.push(...chunkedDocs);
      }
      return allChunkedDocs;
    } catch (err) {
      console.log('error while creating chunks of pdfs');
      console.log(err);
    }
  }

  async embedAndStoreDocs(
    client: Pinecone,
    docs: Document<Record<string, any>>[],
  ) {
    try {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: this.config.get('OPENAI_APIKEY'),
      });
      const index = client.Index(this.config.get('PINECONE_INDEX'));

      await PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex: index,
        textKey: 'text',
      });
    } catch (error) {
      console.log('Failed to load your docs!');
      console.log(error);
    }
  }

  async getVectorStore(client: Pinecone) {
    try {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: this.config.get('OPENAI_APIKEY'),
      });
      const index = client.Index(this.config.get('PINECONE_INDEX'));

      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        textKey: 'text',
      });

      return vectorStore;
    } catch (error) {
      console.log('Something went wrong while getting vector store !');
      console.log(error);
    }
  }

  async loadPDFs(chatRoomId: string, organizationName: string) {
    const supabaseClient = this.getSupabaseClient();
    const { data, error } = await supabaseClient.storage
      .from(this.config.get('SUPABASE_BUCKET_NAME'))
      .list(`${organizationName}/chat_room_${chatRoomId}`, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      console.log('Error while fetching files from database');
      throw new HttpException(
        {
          message: error.message,
          error: (error as any).error,
          statusCode: (error as any).statusCode,
        },
        (error as any).statusCode,
      );
    }

    const files = data.filter(
      (file) => file.name !== '.emptyFolderPlaceholder',
    );

    if (!files.length) {
      throw new BadRequestException('Please upload files to proceed');
    }

    const { data: signedURLData, error: signedURLError } =
      await supabaseClient.storage
        .from(this.config.get('SUPABASE_BUCKET_NAME'))
        .createSignedUrls(
          files.map(
            (file) =>
              `${organizationName}/chat_room_${chatRoomId}/${file.name}`,
          ),
          300,
        );

    if (signedURLError) {
      console.log('Error while fetching signed urls');
      throw new HttpException(
        {
          message: signedURLError.message,
          error: (signedURLError as any).error,
          statusCode: (signedURLError as any).statusCode,
        },
        (signedURLError as any).statusCode,
      );
    }

    const allPdfPaths = signedURLData.map((file) => file.signedUrl);

    try {
      console.log('Getting pinecone client');
      const pineconeClient = this.getPineconeClient();
      console.log('Creating chunks');
      const chunkedDocs = await this.getChunkedDocsFromPDF(allPdfPaths);
      console.log('creating embeddings and storing chunked docs');
      await this.embedAndStoreDocs(pineconeClient, chunkedDocs);
    } catch (err) {
      console.log('Error while loading pdf in vector db');
    }
  }
}
