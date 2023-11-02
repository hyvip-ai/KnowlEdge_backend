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
import { qaChain, questionGeneratorChain } from 'src/llm';
import { RunnableSequence } from 'langchain/schema/runnable';
import { VectorStoreRetriever } from 'langchain/dist/vectorstores/base';
import { formatDocumentsAsString } from 'langchain/util/document';

@Injectable()
export class CommonService {
  constructor(private config: ConfigService) {}

  private supabaseClient: SupabaseClient;
  private pineconeClient: Pinecone;

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
    client: Pinecone,
    docs: Document<Record<string, any>>[],
  ) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.config.get('OPENAI_APIKEY'),
    });
    const index = client.Index(this.config.get('PINECONE_INDEX'));

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      textKey: 'text',
    });
  }

  async getVectorStore(client: Pinecone) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.config.get('OPENAI_APIKEY'),
    });
    const index = client.Index(this.config.get('PINECONE_INDEX'));

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: 'text',
    });

    return vectorStore;
  }

  async formatChatHistory() {
    return null;
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

    const pineconeClient = this.getPineconeClient();
    const chunkedDocs = await this.getChunkedDocsFromPDF(allPdfPaths);
    await this.embedAndStoreDocs(pineconeClient, chunkedDocs);
  }

  async performQuestionAnswering(data: {
    question: string;
    chatHistory: string | null;
    context: Array<Document>;
  }) {
    console.log('Chat History');
    console.log(data.chatHistory);

    const newQuestion = data.question;
    const chatHistoryString = null;
    const serializedContext = formatDocumentsAsString(data.context);

    console.log(data.context);

    if (data.chatHistory) {
      const answer = await questionGeneratorChain.invoke({
        context: serializedContext,
        chatHistory: data.chatHistory,
        question: newQuestion,
      });

      console.log(answer);
    }

    const { text } = await qaChain.invoke({
      chatHistory: chatHistoryString ?? '',
      context: serializedContext,
      question: newQuestion,
    });

    const firstTwoDocuments = data.context.slice(0, 2);

    return { response: text, context: firstTwoDocuments };
  }

  getChain(retriever: VectorStoreRetriever<PineconeStore>) {
    const chain = RunnableSequence.from([
      {
        question: (data: { question: string; chatHistory?: string }) => {
          return data.question.trim().replace(/\n/g, ' ');
        },
        chatHistory: (data: { question: string; chatHistory?: string }) =>
          data.chatHistory ?? '',
        context: async (input: { question: string; chatHistory?: string }) => {
          const relatedDocs = await retriever.getRelevantDocuments(
            input.question,
          );
          return relatedDocs;
        },
      },
      this.performQuestionAnswering,
    ]);
    return chain;
  }

  // { id, role, content } message
  async generateAIResponse(data: { question: string; chatHistory?: string }) {
    const pineconeClient = this.getPineconeClient();
    const vectorStore = await this.getVectorStore(pineconeClient);
    const retriever = vectorStore.asRetriever();
    const chain = this.getChain(retriever);
    return await chain.invoke({
      question: data.question,
      chatHistory: data.chatHistory,
    });
  }
}
