/**
 * SocialSentinel Native Sentiment Analysis Engine
 * High-performance, zero-dependency polarity classification with lexicon scoring
 * and negation handling. Guaranteed 100% offline and edge-compatible.
 */

export interface SentimentResult {
  text: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  confidence: number;
  probabilities: {
    positive: number;
    neutral: number;
    negative: number;
  };
  model_version: string;
}

const POSITIVE_LEXICON: Record<string, number> = {
  love: 3.2, amazing: 3.4, wonderful: 3.2, great: 2.8, excellent: 3.5,
  awesome: 3.1, fantastic: 3.3, brilliant: 3.2, beautiful: 2.9, happy: 2.8,
  joy: 3.0, excited: 2.9, stellar: 3.1, superb: 3.2, inspiring: 3.0,
  best: 3.2, fascinating: 2.8, incredible: 3.3, favorite: 2.7, genius: 3.1,
  cool: 2.0, spectacular: 3.2, progress: 2.5, success: 3.0, win: 2.8,
  breakthrough: 3.2, marvelous: 3.0, uplifting: 2.9, radiant: 2.7, delight: 2.8,
  optimistic: 2.6, safe: 2.4, clean: 2.0, robust: 2.5, smooth: 2.2,
  groundbreaking: 3.4, phenomenal: 3.3, enjoy: 2.5, glad: 2.2, thrive: 2.8,
  flourish: 2.9, empowered: 2.8, transparent: 2.5, resilient: 2.8, healthy: 2.6
};

const NEGATIVE_LEXICON: Record<string, number> = {
  bad: 2.5, terrible: 3.5, horrible: 3.6, worst: 3.8, hate: 3.5,
  awful: 3.4, sad: 2.6, disappointed: 2.8, angry: 3.0, broken: 2.9,
  bug: 2.2, fail: 2.8, failure: 3.0, crisis: 3.4, disaster: 3.6,
  tragic: 3.2, depressed: 3.1, ugly: 2.4, pain: 2.7, annoying: 2.3,
  poor: 2.2, boring: 2.0, useless: 3.0, toxic: 3.4, sluggish: 2.3,
  crash: 3.1, vulnerable: 2.8, exploit: 3.2, insecure: 2.9, fatigue: 2.5,
  anxious: 2.6, worry: 2.4, fear: 2.8, dread: 3.0, shame: 2.9,
  corrupt: 3.3, breach: 3.1, fraud: 3.4, fake: 2.6, suffering: 3.2
};

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'hardly', 'scarcely', 'barely', "n't", 'without', 'cannot', "can't", "won't", "don't"
]);

export function predictSentiment(text: string): SentimentResult {
  if (!text || !text.trim()) {
    return {
      text: '',
      sentiment: 'Neutral',
      confidence: 0.5,
      probabilities: { positive: 0.2, neutral: 0.6, negative: 0.2 },
      model_version: 'Sentinel-Native-NLP-v5'
    };
  }

  const cleanText = text.trim();
  const rawTokens = cleanText.toLowerCase().match(/\b[a-z']{2,}\b/g) || [];

  let posScore = 0;
  let negScore = 0;
  let isNegated = false;

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];

    if (NEGATION_WORDS.has(token)) {
      isNegated = true;
      continue;
    }

    const posVal = POSITIVE_LEXICON[token] || 0;
    const negVal = NEGATIVE_LEXICON[token] || 0;

    if (posVal > 0) {
      if (isNegated) {
        negScore += posVal * 0.8;
      } else {
        posScore += posVal;
      }
      isNegated = false;
    } else if (negVal > 0) {
      if (isNegated) {
        posScore += negVal * 0.6;
      } else {
        negScore += negVal;
      }
      isNegated = false;
    } else {
      // Clear negation after 3 non-sentiment words
      if (i > 0 && i % 3 === 0) isNegated = false;
    }
  }

  // Softmax-like probability distribution
  const total = posScore + negScore;
  let pPos = 0.2;
  let pNeu = 0.6;
  let pNeg = 0.2;

  if (total > 0) {
    const delta = (posScore - negScore) / total;
    if (delta > 0.15) {
      pPos = Math.min(0.96, 0.45 + delta * 0.5);
      pNeu = Math.max(0.03, 0.5 - delta * 0.4);
      pNeg = Math.max(0.01, 1 - pPos - pNeu);
    } else if (delta < -0.15) {
      const absDelta = Math.abs(delta);
      pNeg = Math.min(0.96, 0.45 + absDelta * 0.5);
      pNeu = Math.max(0.03, 0.5 - absDelta * 0.4);
      pPos = Math.max(0.01, 1 - pNeg - pNeu);
    } else {
      pNeu = 0.75;
      pPos = 0.15;
      pNeg = 0.10;
    }
  }

  const pSum = pPos + pNeu + pNeg;
  pPos = Math.round((pPos / pSum) * 1000) / 1000;
  pNeu = Math.round((pNeu / pSum) * 1000) / 1000;
  pNeg = Math.round((pNeg / pSum) * 1000) / 1000;

  let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
  let confidence = pNeu;

  if (pPos > pNeu && pPos > pNeg) {
    sentiment = 'Positive';
    confidence = pPos;
  } else if (pNeg > pNeu && pNeg > pPos) {
    sentiment = 'Negative';
    confidence = pNeg;
  }

  return {
    text: cleanText,
    sentiment,
    confidence,
    probabilities: {
      positive: pPos,
      neutral: pNeu,
      negative: pNeg
    },
    model_version: 'Sentinel-Native-NLP-v5'
  };
}
