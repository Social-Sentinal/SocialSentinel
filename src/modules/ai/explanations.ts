/**
 * SocialSentinel Transparent Explainability Engine
 * Provides detailed, grounded explanations for recommendations and tone evaluations.
 */

export interface ExplanationDetails {
  summary: string;
  signals: {
    label: string;
    value: string | number;
    contribution: 'High' | 'Medium' | 'Low';
  }[];
  transparency_note: string;
}

export function generatePostExplanation(
  postCaption: string,
  topic: string,
  authorUsername: string,
  signals: {
    isFollowing: boolean;
    topicInteractions: number;
    contentSimilarity: number;
    engagementVelocity: number;
  }
): ExplanationDetails {
  const signalList: ExplanationDetails['signals'] = [];

  if (signals.isFollowing) {
    signalList.push({
      label: 'Social Graph',
      value: `You follow @${authorUsername}`,
      contribution: 'High',
    });
  }

  if (signals.topicInteractions > 0) {
    signalList.push({
      label: 'Topic Affinity',
      value: `${signals.topicInteractions} recorded interactions in #${topic}`,
      contribution: signals.topicInteractions > 5 ? 'High' : 'Medium',
    });
  }

  if (signals.contentSimilarity > 0.2) {
    signalList.push({
      label: 'Semantic Match',
      value: `${Math.round(signals.contentSimilarity * 100)}% vocabulary alignment with your saved posts`,
      contribution: signals.contentSimilarity > 0.4 ? 'High' : 'Medium',
    });
  }

  if (signals.engagementVelocity > 0.5) {
    signalList.push({
      label: 'Community Velocity',
      value: 'High discussion engagement across the network',
      contribution: 'Medium',
    });
  }

  const primaryReason = signalList[0]?.value || `Suggested to broaden your perspective into #${topic}`;

  return {
    summary: `🛡️ Surfaced because: ${primaryReason}.`,
    signals: signalList,
    transparency_note:
      'SocialSentinel uses an open, explainable ranking function without opaque black-box profiling. You can adjust your exploration rate or mute topics anytime in Healthy Feed controls.',
  };
}
