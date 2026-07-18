export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  estimatedCostETB: number;
}

export interface MonthlyTokenBudget {
  used: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  isOverLimit: boolean;
}

const GPT4O_INPUT_COST_PER_1K = 0.005;
const GPT4O_OUTPUT_COST_PER_1K = 0.015;
const WHISPER_COST_PER_MINUTE = 0.006;
const TTS_COST_PER_1K_CHARS = 0.015;
const USD_TO_ETB_RATE = 125;

const monthlyTokenStore: Record<string, number> = {};

export const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};

export const calculateCost = (
  promptTokens: number,
  completionTokens: number
): { usd: number; etb: number } => {
  const inputCost = (promptTokens / 1000) * GPT4O_INPUT_COST_PER_1K;
  const outputCost =
    (completionTokens / 1000) * GPT4O_OUTPUT_COST_PER_1K;
  const totalUSD = inputCost + outputCost;
  const totalETB = totalUSD * USD_TO_ETB_RATE;

  return {
    usd: Math.round(totalUSD * 10000) / 10000,
    etb: Math.round(totalETB * 100) / 100,
  };
};

export const calculateWhisperCost = (
  audioDurationSeconds: number
): { usd: number; etb: number } => {
  const minutes = audioDurationSeconds / 60;
  const usd = minutes * WHISPER_COST_PER_MINUTE;
  const etb = usd * USD_TO_ETB_RATE;

  return {
    usd: Math.round(usd * 10000) / 10000,
    etb: Math.round(etb * 100) / 100,
  };
};

export const calculateTTSCost = (
  text: string
): { usd: number; etb: number } => {
  const characters = text.length;
  const usd = (characters / 1000) * TTS_COST_PER_1K_CHARS;
  const etb = usd * USD_TO_ETB_RATE;

  return {
    usd: Math.round(usd * 10000) / 10000,
    etb: Math.round(etb * 100) / 100,
  };
};

export const buildTokenUsage = (
  promptTokens: number,
  completionTokens: number
): TokenUsage => {
  const cost = calculateCost(promptTokens, completionTokens);

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCostUSD: cost.usd,
    estimatedCostETB: cost.etb,
  };
};

export const trackMonthlyUsage = (
  sessionId: string,
  tokensUsed: number
): void => {
  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  const key = `${sessionId}-${monthKey}`;

  if (!monthlyTokenStore[key]) {
    monthlyTokenStore[key] = 0;
  }

  monthlyTokenStore[key] += tokensUsed;
};

export const getMonthlyTokenBudget = (
  sessionId: string,
  monthlyLimit: number = 100000
): MonthlyTokenBudget => {
  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  const key = `${sessionId}-${monthKey}`;
  const used = monthlyTokenStore[key] || 0;

  return {
    used,
    limit: monthlyLimit,
    remaining: Math.max(0, monthlyLimit - used),
    percentageUsed: Math.round((used / monthlyLimit) * 100 * 10) / 10,
    isOverLimit: used >= monthlyLimit,
  };
};

export const isWithinTokenBudget = (
  sessionId: string,
  monthlyLimit: number = 100000
): boolean => {
  const budget = getMonthlyTokenBudget(sessionId, monthlyLimit);
  return !budget.isOverLimit;
};

export const formatTokenUsageReport = (
  usage: TokenUsage
): string => {
  return `
Tokens Used: ${usage.totalTokens.toLocaleString()}
  - Prompt: ${usage.promptTokens.toLocaleString()}
  - Completion: ${usage.completionTokens.toLocaleString()}
Estimated Cost: $${usage.estimatedCostUSD} USD (ETB ${usage.estimatedCostETB})
  `.trim();
};

export const estimateRemainingBudgetMessages = (
  remainingTokens: number,
  avgTokensPerMessage: number = 500
): number => {
  return Math.floor(remainingTokens / avgTokensPerMessage);
};
