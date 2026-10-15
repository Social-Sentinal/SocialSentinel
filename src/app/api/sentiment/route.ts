import { NextRequest, NextResponse } from 'next/server';
import { predictSentiment } from '@/modules/ai/sentiment';
import { detectEmotion } from '@/modules/ai/emotion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = (body.text || '').trim();

    if (!text) {
      return NextResponse.json({ message: 'Text is required for sentiment inference' }, { status: 400 });
    }

    const sentiment = predictSentiment(text);
    const emotion = detectEmotion(text);

    return NextResponse.json({
      ...sentiment,
      emotion: emotion.emotion,
      emotion_confidence: emotion.confidence,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 });
  }
}
