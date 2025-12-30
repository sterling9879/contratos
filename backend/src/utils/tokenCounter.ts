// Token estimation utilities for Gemini API
// Gemini uses similar tokenization to GPT models

export const tokenCounter = {
  // Estimate tokens for Portuguese text
  // Average is about 4 characters per token for Portuguese
  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  },

  // Estimate tokens for a contract analysis request
  estimateAnalysisTokens(contractText: string): {
    inputTokens: number;
    estimatedOutputTokens: number;
    totalEstimated: number;
  } {
    const inputTokens = this.estimateTokens(contractText);
    // Output is typically 10-20% of input for analysis
    const estimatedOutputTokens = Math.ceil(inputTokens * 0.15);

    return {
      inputTokens,
      estimatedOutputTokens,
      totalEstimated: inputTokens + estimatedOutputTokens,
    };
  },

  // Estimate tokens for chat
  estimateChatTokens(
    systemPrompt: string,
    history: Array<{ content: string }>,
    newMessage: string
  ): number {
    const systemTokens = this.estimateTokens(systemPrompt);
    const historyTokens = history.reduce(
      (acc, msg) => acc + this.estimateTokens(msg.content),
      0
    );
    const messageTokens = this.estimateTokens(newMessage);

    return systemTokens + historyTokens + messageTokens;
  },

  // Estimate cost based on Gemini 1.5 Pro pricing
  // Note: Prices as of 2024, check Google's pricing page for updates
  estimateCost(inputTokens: number, outputTokens: number): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  } {
    // Gemini 1.5 Pro pricing (per 1M tokens)
    const INPUT_PRICE_PER_MILLION = 3.5; // $3.50 per 1M input tokens
    const OUTPUT_PRICE_PER_MILLION = 10.5; // $10.50 per 1M output tokens

    const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION;
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  },

  // Check if text exceeds token limit
  exceedsLimit(text: string, maxTokens: number): boolean {
    return this.estimateTokens(text) > maxTokens;
  },

  // Truncate text to fit within token limit
  truncateToFit(text: string, maxTokens: number): string {
    const currentTokens = this.estimateTokens(text);
    if (currentTokens <= maxTokens) return text;

    // Estimate characters needed
    const targetChars = Math.floor((maxTokens / currentTokens) * text.length);
    return text.substring(0, targetChars) + '...[texto truncado]';
  },

  // Format token count for display
  formatTokenCount(tokens: number): string {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toString();
  },
};
