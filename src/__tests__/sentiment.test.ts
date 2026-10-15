import { describe, it, expect } from 'vitest';
import { predictSentiment } from '@/modules/ai/sentiment';

describe('Sentinel Native Sentiment Analysis Engine', () => {
  it('correctly classifies strongly positive text with high confidence', () => {
    const res = predictSentiment('This is an amazing, brilliant, and wonderful breakthrough!');
    expect(res.sentiment).toBe('Positive');
    expect(res.confidence).toBeGreaterThan(0.7);
    expect(res.probabilities.positive).toBeGreaterThan(res.probabilities.negative);
    expect(res.probabilities.positive).toBeGreaterThan(res.probabilities.neutral);
  });

  it('correctly classifies negative sentiment and critical tone', () => {
    const res = predictSentiment('This system is broken, terrible, and suffering from catastrophic failure.');
    expect(res.sentiment).toBe('Negative');
    expect(res.confidence).toBeGreaterThan(0.7);
    expect(res.probabilities.negative).toBeGreaterThan(res.probabilities.positive);
  });

  it('correctly classifies neutral technical descriptions', () => {
    const res = predictSentiment('Today is Wednesday and we are reviewing pull requests.');
    expect(res.sentiment).toBe('Neutral');
    expect(res.confidence).toBeGreaterThan(0.5);
  });

  it('handles negation correctly without false positives', () => {
    const negatedNegative = predictSentiment('This design is not bad and never broken.');
    expect(negatedNegative.sentiment).not.toBe('Negative');

    const negatedPositive = predictSentiment('This is not good and not wonderful.');
    expect(negatedPositive.sentiment).not.toBe('Positive');
  });

  it('gracefully handles empty and whitespace-only text', () => {
    const emptyRes = predictSentiment('   ');
    expect(emptyRes.sentiment).toBe('Neutral');
    expect(emptyRes.confidence).toBe(0.5);
    expect(emptyRes.text).toBe('');
  });

  it('normalizes probabilities such that their sum equals 1.0', () => {
    const res = predictSentiment('Exploring the cosmos and discovering new galaxies.');
    const sum = res.probabilities.positive + res.probabilities.neutral + res.probabilities.negative;
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.01);
  });
});
