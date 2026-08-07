// SocialSentinel Central API Client Service

const API_BASE = '/api/v1';

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const fetchPosts = async () => {
  const res = await fetch(`${API_BASE}/posts`);
  return handleResponse(res);
};

export const toggleLikePost = async (postId, isLiked) => {
  const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked: isLiked }),
  });
  return handleResponse(res);
};

export const addCommentToPost = async (postId, commentText, username = 'social_explorer') => {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: commentText, username }),
  });
  return handleResponse(res);
};

export const predictSentimentText = async (text) => {
  const formData = new FormData();
  formData.append('text', text);

  const res = await fetch(`${API_BASE}/sentiment/predict`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

export const fetchEmotionDetection = async (text) => {
  const formData = new FormData();
  formData.append('text', text);

  const res = await fetch(`${API_BASE}/sentiment/emotion`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

export const fetchContentRecommendations = async (userInput) => {
  const formData = new FormData();
  formData.append('user_input', userInput);

  const res = await fetch(`${API_BASE}/recommendations/content`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

export const fetchCollaborativeRecommendations = async () => {
  const res = await fetch(`${API_BASE}/recommendations/collaborative`);
  return handleResponse(res);
};

export const fetchAnalyticsOverview = async () => {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  return handleResponse(res);
};

export const fetchUserProfile = async (username) => {
  const res = await fetch(`${API_BASE}/instagram/user/${username}`);
  return handleResponse(res);
};

export const fetchLiveInstagramData = async (query) => {
  const res = await fetch(`${API_BASE}/instagram/fetch-live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return handleResponse(res);
};

export const fetchFeedRecommendations = async (query = 'career failure breakup success', steering = true, limit = 10) => {
  const params = new URLSearchParams({ query, steering: steering ? 'true' : 'false', limit: limit.toString() });
  const res = await fetch(`${API_BASE}/recommendations/feed?${params.toString()}`);
  return handleResponse(res);
};

export const fetchUserWellbeing = async () => {
  const res = await fetch(`${API_BASE}/user/wellbeing`);
  return handleResponse(res);
};

export const createNewPost = async (postData) => {
  const res = await fetch(`${API_BASE}/posts/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  return handleResponse(res);
};

export const logUserInteraction = async (interactionData) => {
  const res = await fetch(`${API_BASE}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interactionData),
  });
  return handleResponse(res);
};




