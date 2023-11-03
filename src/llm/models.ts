import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';
import { QA_TEMPLATE } from './promptTemplates';
import { PromptTemplate } from 'langchain/prompts';

const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
  openAIApiKey: process.env.OPENAI_APIKEY,
});

export const qaChain = new LLMChain({
  llm: model,
  prompt: PromptTemplate.fromTemplate(QA_TEMPLATE),
});
