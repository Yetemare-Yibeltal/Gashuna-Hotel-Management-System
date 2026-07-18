import { generateStructuredResponse } from './openaiService';
import { SENTIMENT_ANALYSIS_PROMPT } from '../prompts/hotelAssistantPrompt';

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence: number;
  keyTopics: string[];
  summary: string;
}

export interface BatchSentimentResult {
  results: Array<{
    text: string;
    sentiment: SentimentResult;
  }>;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  averageScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
}

export const analyzeSentiment = async (
  text: string
): Promise<SentimentResult> => {
  try {
    const prompt = `Analyze the sentiment of this guest feedback:\n\n"${text}"`;

    const result = await generateStructuredResponse<SentimentResult>(
      prompt,
      SENTIMENT_ANALYSIS_PROMPT
    );

    return (
      result.data || {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        keyTopics: [],
        summary: 'Unable to analyze sentiment.',
      }
    );
  } catch {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      keyTopics: [],
      summary: 'Sentiment analysis failed.',
    };
  }
};

export const analyzeBatchSentiment = async (
  texts: string[]
): Promise<BatchSentimentResult> => {
  const results = await Promise.all(
    texts.map(async (text) => ({
      text,
      sentiment: await analyzeSentiment(text),
    }))
  );

  const scores = results.map((r) => r.sentiment.score);
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

  const positiveCount = results.filter(
    (r) => r.sentiment.sentiment === 'positive'
  ).length;
  const negativeCount = results.filter(
    (r) => r.sentiment.sentiment === 'negative'
  ).length;
  const neutralCount = results.filter(
    (r) => r.sentiment.sentiment === 'neutral'
  ).length;

  let overallSentiment: 'positive' | 'neutral' | 'negative' =
    'neutral';
  if (averageScore > 0.2) overallSentiment = 'positive';
  if (averageScore < -0.2) overallSentiment = 'negative';

  return {
    results,
    overallSentiment,
    averageScore: Math.round(averageScore * 100) / 100,
    positiveCount,
    neutralCount,
    negativeCount,
  };
};

export const analyzeGuestFeedback = async (
  feedbackItems: Array<{ text: string; source: string; date: Date }>
): Promise<{
  overall: BatchSentimentResult;
  topPositiveTopics: string[];
  topNegativeTopics: string[];
  actionableInsights: string[];
}> => {
  const texts = feedbackItems.map((f) => f.text);
  const batchResult = await analyzeBatchSentiment(texts);

  const positiveTopics: Record<string, number> = {};
  const negativeTopics: Record<string, number> = {};

  batchResult.results.forEach((result) => {
    result.sentiment.keyTopics.forEach((topic) => {
      if (result.sentiment.sentiment === 'positive') {
        positiveTopics[topic] = (positiveTopics[topic] || 0) + 1;
      } else if (result.sentiment.sentiment === 'negative') {
        negativeTopics[topic] = (negativeTopics[topic] || 0) + 1;
      }
    });
  });

  const topPositiveTopics = Object.entries(positiveTopics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic]) => topic);

  const topNegativeTopics = Object.entries(negativeTopics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic]) => topic);

  const actionableInsights: string[] = [];

  if (batchResult.negativeCount > batchResult.positiveCount) {
    actionableInsights.push(
      'Overall guest sentiment is negative — immediate management review recommended.'
    );
  }

  if (topNegativeTopics.includes('cleanliness')) {
    actionableInsights.push(
      'Multiple guests mentioned cleanliness issues — review housekeeping standards.'
    );
  }

  if (topNegativeTopics.includes('service')) {
    actionableInsights.push(
      'Service quality concerns detected — staff training may be needed.'
    );
  }

  if (topNegativeTopics.includes('food')) {
    actionableInsights.push(
      'Restaurant feedback is negative — review menu quality and preparation.'
    );
  }

  if (topPositiveTopics.includes('location')) {
    actionableInsights.push(
      'Guests appreciate the hotel location — highlight this in marketing materials.'
    );
  }

  if (actionableInsights.length === 0) {
    actionableInsights.push(
      'Guest sentiment is generally positive — maintain current service standards.'
    );
  }

  return {
    overall: batchResult,
    topPositiveTopics,
    topNegativeTopics,
    actionableInsights,
  };
};
