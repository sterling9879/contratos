import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { buildAnalysisPrompt, buildQuickAnalysisPrompt } from '../prompts/analyze';
import { buildGenerationPrompt } from '../prompts/generate';
import { buildChatSystemPrompt } from '../prompts/chat';
import { ContractAnalysis, ContractGenerationData, ChatMessage } from '../types';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Model configurations
const ANALYSIS_CONFIG = {
  temperature: 0.1, // Low for precise analysis
  topP: 0.8,
  maxOutputTokens: 8192,
};

const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 16384,
};

const CHAT_CONFIG = {
  temperature: 0.5,
  topP: 0.9,
  maxOutputTokens: 4096,
};

export const geminiService = {
  getModel(config: typeof ANALYSIS_CONFIG): GenerativeModel {
    return genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: config,
    });
  },

  async analyzeContract(contractText: string): Promise<ContractAnalysis> {
    const model = this.getModel(ANALYSIS_CONFIG);
    const prompt = buildAnalysisPrompt(contractText);

    logger.info({ textLength: contractText.length }, 'Starting contract analysis');

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      logger.debug({ responseLength: response.length }, 'Received Gemini response');

      return this.parseAnalysisResponse(response);
    } catch (error) {
      logger.error({ error }, 'Error analyzing contract with Gemini');
      throw new Error('Falha ao analisar contrato. Por favor, tente novamente.');
    }
  },

  async quickAnalysis(contractText: string): Promise<Partial<ContractAnalysis>> {
    const model = this.getModel({ ...ANALYSIS_CONFIG, maxOutputTokens: 2048 });
    const prompt = buildQuickAnalysisPrompt(contractText);

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return this.parseAnalysisResponse(response);
    } catch (error) {
      logger.error({ error }, 'Error in quick analysis');
      throw error;
    }
  },

  parseAnalysisResponse(response: string): ContractAnalysis {
    // Try to parse directly
    try {
      return JSON.parse(response);
    } catch {
      // Try to extract JSON from response with markdown
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          logger.error({ response: response.substring(0, 500) }, 'Failed to parse extracted JSON');
        }
      }

      logger.error({ response: response.substring(0, 500) }, 'Failed to parse Gemini response');
      throw new Error('Falha ao processar resposta da análise. Por favor, tente novamente.');
    }
  },

  async generateContract(data: ContractGenerationData): Promise<string> {
    const model = this.getModel(GENERATION_CONFIG);
    const prompt = buildGenerationPrompt(data);

    logger.info({ tipo: data.tipo }, 'Generating contract');

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      logger.debug({ responseLength: response.length }, 'Contract generated');

      return response;
    } catch (error) {
      logger.error({ error }, 'Error generating contract');
      throw new Error('Falha ao gerar contrato. Por favor, tente novamente.');
    }
  },

  async chat(
    contractText: string,
    analysis: ContractAnalysis | null,
    history: ChatMessage[],
    message: string
  ): Promise<string> {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: CHAT_CONFIG,
      systemInstruction: buildChatSystemPrompt(contractText, analysis),
    });

    const formattedHistory = history.map((h) => ({
      role: h.role === 'USER' ? ('user' as const) : ('model' as const),
      parts: [{ text: h.content }],
    }));

    logger.info({ historyLength: history.length }, 'Starting chat');

    try {
      const chat: ChatSession = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(message);
      const response = result.response.text();

      logger.debug({ responseLength: response.length }, 'Chat response received');

      return response;
    } catch (error) {
      logger.error({ error }, 'Error in chat');
      throw new Error('Falha ao processar mensagem. Por favor, tente novamente.');
    }
  },

  // Estimate tokens for usage tracking
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for Portuguese
    return Math.ceil(text.length / 4);
  },

  // Check if API key is configured
  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  },
};
