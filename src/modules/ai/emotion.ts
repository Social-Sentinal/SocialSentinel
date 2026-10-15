/**
 * SocialSentinel Native Emotion Detection Engine
 * Classifies text into 7 validated social intelligence emotions:
 * joy, wonder, curiosity, inspiration, empathy, concern, sadness.
 */

import { EmotionType } from '@/types/database.types';

export interface EmotionResult {
  emotion: EmotionType;
  confidence: number;
  model_version: string;
}

interface EmotionRule {
  emotion: EmotionType;
  patterns: RegExp[];
  baseConfidence: number;
}

const EMOTION_RULES: EmotionRule[] = [
  {
    emotion: 'joy',
    patterns: [/\b(happy|joy|love|delight\w*|celebrat\w*|excit\w*|wonderful|thrill\w*|smile\w*|ecstatic|cheer\w*)\b/gi],
    baseConfidence: 0.88,
  },
  {
    emotion: 'wonder',
    patterns: [/\b(universe|galaxy|stars|mystery|astronomy|stunning|marvel|breathtaking|cosmos|awe|infinite)\b/gi],
    baseConfidence: 0.88,
  },
  {
    emotion: 'curiosity',
    patterns: [/\b(discover|explore|learn|curious\w*|how|why|question\w*|research\w*|study\w*|investigat\w*|benchmark\w*|analyz\w*)\b/gi],
    baseConfidence: 0.82,
  },
  {
    emotion: 'inspiration',
    patterns: [/\b(create|innovat\w*|build|future|dream|vision|inspire\w*|breakthrough\w*|achiev\w*|empower\w*|transform\w*)\b/gi],
    baseConfidence: 0.87,
  },
  {
    emotion: 'empathy',
    patterns: [/\b(support\w*|care\w*|friend\w*|help\w*|community\w*|together|listen\w*|share\w*|connect\w*|mindful\w*|wellbeing|balance)\b/gi],
    baseConfidence: 0.81,
  },
  {
    emotion: 'concern',
    patterns: [/\b(worry|risk\w*|danger\w*|fear\w*|trouble|problem\w*|alert\w*|warning\w*|vulnerab\w*|breach\w*|insecure|threat\w*)\b/gi],
    baseConfidence: 0.85,
  },
  {
    emotion: 'sadness',
    patterns: [/\b(sad\w*|grief|cry|miss\w*|lost|heartbreak\w*|down|depress\w*|pain\w*|unfortunate|disappoint\w*)\b/gi],
    baseConfidence: 0.84,
  },
];

export function detectEmotion(text: string): EmotionResult {
  if (!text || !text.trim()) {
    return {
      emotion: 'curiosity',
      confidence: 0.5,
      model_version: 'Sentinel-Native-Emotion-v3',
    };
  }

  const clean = text.toLowerCase();
  const matched: { emotion: EmotionType; confidence: number }[] = [];

  for (const rule of EMOTION_RULES) {
    let hits = 0;
    for (const pat of rule.patterns) {
      const match = clean.match(pat);
      if (match) hits += match.length;
    }
    if (hits > 0) {
      matched.push({
        emotion: rule.emotion,
        confidence: Math.min(0.98, rule.baseConfidence + 0.04 * (hits - 1)),
      });
    }
  }

  if (matched.length > 0) {
    matched.sort((a, b) => b.confidence - a.confidence);
    return {
      emotion: matched[0].emotion,
      confidence: Math.round(matched[0].confidence * 1000) / 1000,
      model_version: 'Sentinel-Native-Emotion-v3',
    };
  }

  return {
    emotion: 'curiosity',
    confidence: 0.65,
    model_version: 'Sentinel-Native-Emotion-v3',
  };
}
