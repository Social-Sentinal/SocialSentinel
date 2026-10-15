import { describe, it, expect } from 'vitest';
import { detectEmotion } from '@/modules/ai/emotion';

describe('Sentinel Native Emotion Detection Engine', () => {
  it('detects Joy from celebratory and cheerful expressions', () => {
    const res = detectEmotion('We are thrilled and delighted to celebrate this achievement!');
    expect(res.emotion).toBe('joy');
    expect(res.confidence).toBeGreaterThan(0.8);
  });

  it('detects Wonder from cosmic and awe-inspiring topics', () => {
    const res = detectEmotion('The breathtaking beauty of distant galaxies and the mysteries of the cosmos.');
    expect(res.emotion).toBe('wonder');
    expect(res.confidence).toBeGreaterThan(0.8);
  });

  it('detects Curiosity from research and inquiry text', () => {
    const res = detectEmotion('How do we benchmark and analyze the latency tradeoffs in this algorithm?');
    expect(res.emotion).toBe('curiosity');
  });

  it('detects Inspiration from visionary building language', () => {
    const res = detectEmotion('Let us build and innovate the future of transparent AI systems.');
    expect(res.emotion).toBe('inspiration');
  });

  it('detects Empathy from community care and wellbeing discussion', () => {
    const res = detectEmotion('Supporting our friends and listening to one another with mindful care.');
    expect(res.emotion).toBe('empathy');
  });

  it('detects Concern from defensive alert and vulnerability language', () => {
    const res = detectEmotion('Warning: active credential stuffing alert and critical security danger.');
    expect(res.emotion).toBe('concern');
  });

  it('detects Sadness from grief or loss language', () => {
    const res = detectEmotion('A deeply sad day for our entire team as we mourn this loss.');
    expect(res.emotion).toBe('sadness');
  });

  it('defaults to curiosity for ambiguous text', () => {
    const res = detectEmotion('123456789');
    expect(res.emotion).toBe('curiosity');
  });
});
