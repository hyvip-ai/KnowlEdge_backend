import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';
import { QA_TEMPLATE } from './promptTemplates';
import { PromptTemplate } from 'langchain/prompts';

export const qaChain = (openAIApiKey: string) =>
  new LLMChain({
    llm: new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      openAIApiKey,
      streaming: true,
    }),
    prompt: PromptTemplate.fromTemplate(QA_TEMPLATE),
  });
