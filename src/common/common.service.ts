import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as argon2 from 'argon2';
import { Document } from 'langchain/dist/document';
import { WebPDFLoader } from 'langchain/document_loaders/web/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { qaChain } from 'src/llm';
import { RunnableSequence } from 'langchain/schema/runnable';
import { VectorStoreRetriever } from 'langchain/dist/vectorstores/base';
import { formatDocumentsAsString } from 'langchain/util/document';
import { Chroma } from 'langchain/vectorstores/chroma';
import { Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChromaClient } from 'chromadb';

@Injectable()
export class CommonService {
  constructor(private config: ConfigService, private prisma: PrismaService) {}

  private supabaseClient: SupabaseClient;
  private chromaClient: ChromaClient;

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

  getCollectionName(data: { chatRoomId: string }) {
    return `chat_room_${data.chatRoomId}`;
  }

  async getChromaClient() {
    if (this.chromaClient) {
      return this.chromaClient;
    }
    const { ChromaClient } = await Chroma.imports();
    this.chromaClient = new ChromaClient();
    return this.chromaClient;
  }

  async updateChatRoomStatus(chatRoomId: string, status: Status) {
    return await this.prisma.chatRoom.update({
      where: {
        id: chatRoomId,
      },
      data: {
        status,
      },
    });
  }

  async getChunkedDocsFromPDF(pdfPaths: string[]) {
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
  }

  async embedAndStoreDocs(
    docs: Document<Record<string, any>>[],
    openAIApiKey: string,
    collectionName: string,
  ) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey,
    });

    await Chroma.fromDocuments(docs, embeddings, {
      collectionName,
      url: this.config.get('CHROMA_URL'),
    });
  }

  async getVectorStore(openAIApiKey: string, collectionName: string) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey,
    });

    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName,
      url: this.config.get('CHROMA_URL'),
    });

    return vectorStore;
  }

  async loadAllFilesByChatRoom(
    chatRoomId: string,
    organizationName: string,
    openAIApiKey: string,
  ) {
    const supabaseClient = this.getSupabaseClient();
    const { data, error } = await supabaseClient.storage
      .from(this.config.get('SUPABASE_BUCKET_NAME'))
      .list(`${organizationName}/chat_room_${chatRoomId}`, {
        limit: 100,
        offset: 0,
      });

    if (error) {
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

    const chunkedDocs = await this.getChunkedDocsFromPDF(allPdfPaths);
    await this.embedAndStoreDocs(
      chunkedDocs,
      openAIApiKey,
      this.getCollectionName({ chatRoomId }),
    );
  }

  async startChat(
    chatRoomId: string,
    organizationName: string,
    openAIApiKey: string,
  ) {
    const chromaClient = await this.getChromaClient();
    const collections = await chromaClient.listCollections();
    if (
      collections
        .map((collection) => collection.name)
        .includes(this.getCollectionName({ chatRoomId }))
    ) {
      return;
    }
    await this.loadAllFilesByChatRoom(
      chatRoomId,
      organizationName,
      openAIApiKey,
    );
  }

  async performQuestionAnswering(data: {
    question: string;
    chatHistory?: { context: any[]; role: 'ai' | 'user'; content: string }[];
    context: Array<Document>;
    openAIApiKey: string;
  }) {
    const newQuestion = data.question;
    const chatHistoryString = data.chatHistory.length
      ? data.chatHistory
          .map((message) => `${message.role}: ${message.content}\n\n`)
          .join('')
      : '';

    const relevantContext = data.context.slice(0, 2);
    const serializedContext = formatDocumentsAsString(relevantContext);

    const { text } = await qaChain(data.openAIApiKey).invoke({
      chatHistory: chatHistoryString,
      context: serializedContext,
      question: newQuestion,
    });

    return { response: text, context: relevantContext };
  }

  getChain(retriever: VectorStoreRetriever<Chroma>) {
    const chain = RunnableSequence.from([
      {
        question: (data: {
          question: string;
          chatHistory?: {
            context: any[];
            role: 'ai' | 'user';
            content: string;
          }[];
          openAIApiKey: string;
        }) => {
          return data.question.trim().replace(/\n/g, ' ');
        },
        chatHistory: (data: {
          question: string;
          chatHistory?: {
            context: any[];
            role: 'ai' | 'user';
            content: string;
          }[];
          openAIApiKey: string;
        }) => data.chatHistory ?? '',
        context: async (input: {
          question: string;
          chatHistory?: {
            context: any[];
            role: 'ai' | 'user';
            content: string;
          }[];
          openAIApiKey: string;
        }) => {
          const relatedDocs = await retriever.getRelevantDocuments(
            input.question,
          );
          return relatedDocs;
        },
        openAIApiKey: (data: {
          question: string;
          chatHistory?: {
            context: any[];
            role: 'ai' | 'user';
            content: string;
          }[];
          openAIApiKey: string;
        }) => {
          return data.openAIApiKey;
        },
      },
      this.performQuestionAnswering,
    ]);
    return chain;
  }

  async generateAIResponse(data: {
    question: string;
    chatHistory?: { context: any[]; role: 'ai' | 'user'; content: string }[];
    openAIApiKey: string;
    chatRoomId: string;
  }) {
    const vectorStore = await this.getVectorStore(
      data.openAIApiKey,
      this.getCollectionName({
        chatRoomId: data.chatRoomId,
      }),
    );
    const retriever = vectorStore.asRetriever();
    const chain = this.getChain(retriever);
    return await chain.invoke({
      question: data.question,
      chatHistory: data.chatHistory,
      openAIApiKey: data.openAIApiKey,
    });
  }
}
