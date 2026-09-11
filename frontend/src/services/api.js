const BASE = import.meta.env.VITE_API_URL || '/api/v1';

let access = localStorage.getItem('cosmos_access') || localStorage.getItem('ss_access');
const refresh = () => localStorage.getItem('cosmos_refresh') || localStorage.getItem('ss_refresh');

async function request(path, opt = {}) {
  let r = await fetch(BASE + path, {
    ...opt,
    headers: {
      'Content-Type': 'application/json',
      Authorization: access ? `Bearer ${access}` : '',
      ...(opt.headers || {})
    }
  });

  if (r.status === 401 && refresh()) {
    try {
      const x = await fetch(BASE + '/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${refresh()}` }
      });
      if (x.ok) {
        const d = await x.json();
        access = d.access_token;
        localStorage.setItem('cosmos_access', access);
        r = await fetch(BASE + path, {
          ...opt,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access}`,
            ...(opt.headers || {})
          }
        });
      }
    } catch (e) {
      // refresh failed
    }
  }

  let data = {};
  try {
    data = await r.json();
  } catch (e) {
    // empty or non-JSON body
  }

  if (!r.ok) {
    throw new Error(data.message || `Request failed (${r.status})`);
  }
  return data;
}

export const api = {
  get token() {
    return access;
  },
  auth: async (type, body) => {
    const d = await request('/auth/' + type, { method: 'POST', body: JSON.stringify(body) });
    access = d.access_token;
    localStorage.setItem('cosmos_access', d.access_token);
    localStorage.setItem('cosmos_refresh', d.refresh_token);
    return d;
  },
  demoLogin: async () => {
    const d = await request('/auth/demo', { method: 'POST' });
    access = d.access_token;
    localStorage.setItem('cosmos_access', d.access_token);
    localStorage.setItem('cosmos_refresh', d.refresh_token);
    return d;
  },
  logout: () => {
    access = null;
    localStorage.removeItem('cosmos_access');
    localStorage.removeItem('cosmos_refresh');
    localStorage.removeItem('ss_access');
    localStorage.removeItem('ss_refresh');
  },
  me: () => request('/users/me'),
  getUser: (username) => request(`/users/${encodeURIComponent(username)}`),
  updateUser: (body) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  prefs: (body) => request('/users/preferences', { method: 'PUT', body: JSON.stringify(body) }),
  follow: (userId) => request(`/users/${userId}/follow`, { method: 'POST' }),

  // Posts & Feed
  posts: (params = '') => request('/posts' + params),
  feed: (params = '') => request('/recommendations/feed' + params),
  serendipityFeed: (params = '') => request('/recommendations/serendipity' + params),
  post: (body) => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  action: (id, act) => request(`/posts/${id}/${act}`, { method: 'POST' }),
  comments: (id) => request(`/posts/${id}/comments`),
  comment: (id, text) => request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  event: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),

  // Search & Communities
  search: (q) => request('/search?q=' + encodeURIComponent(q)),
  communities: () => request('/communities'),
  joinCommunity: (id) => request(`/communities/${id}/join`, { method: 'POST' }),
  communityPosts: (slug, params = '') => request(`/communities/${slug}/posts` + params),

  // Analytics & Notifications
  analytics: () => request('/analytics/overview'),
  notifications: () => request('/notifications'),
  readAll: () => request('/notifications/read-all', { method: 'POST' }),

  // AI & Sentiment
  predictSentiment: (text) => request('/sentiment/predict', { method: 'POST', body: JSON.stringify({ text }) }),
  predictEmotion: (text) => request('/sentiment/emotion', { method: 'POST', body: JSON.stringify({ text }) }),
  ask: (prompt) => request('/ai/ask', { method: 'POST', body: JSON.stringify({ prompt }) }),
  explain: (postId) => request(`/ai/explain/${postId}`),
  models: () => request('/models'),

  // Direct Messaging
  conversations: () => request('/conversations'),
  createConversation: (userIds) => request('/conversations', { method: 'POST', body: JSON.stringify({ user_ids: userIds }) }),
  messages: (convId) => request(`/conversations/${convId}/messages`),
  sendMessage: (convId, body, sharedPostId = null) =>
    request(`/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, shared_post_id: sharedPostId })
    })
};

// Named functions for backwards compatibility with existing legacy components
export const fetchPosts = (page = 1, limit = 20, q = '', topic = '', sentiment = '') => {
  let url = `/posts?page=${page}&limit=${limit}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (topic && topic !== 'All') url += `&topic=${encodeURIComponent(topic)}`;
  if (sentiment && sentiment !== 'All') url += `&sentiment=${encodeURIComponent(sentiment)}`;
  return request(url);
};

export const fetchFeedRecommendations = (query = '', limit = 20) => {
  return request(`/recommendations/feed?limit=${limit}&query=${encodeURIComponent(query)}`);
};

export const fetchAnalyticsOverview = () => api.analytics();

export const fetchLiveInstagramData = async () => {
  return api.posts('?limit=15');
};

export const fetchUserWellbeing = async () => {
  return { status: 'optimal', balance_score: 92, mindful_minutes: 45 };
};

export const fetchContentRecommendations = async () => {
  return request('/recommendations/feed?limit=10');
};

export const fetchCollaborativeRecommendations = async () => {
  return request('/recommendations/serendipity?limit=10');
};

export const createNewPost = (postData) => api.post(postData);

export const predictSentimentText = (text) => api.predictSentiment(text);

export const fetchEmotionDetection = (text) => api.predictEmotion(text);

export const toggleLikePost = (postId) => api.action(postId, 'like');

export const addCommentToPost = (postId, comment) => api.comment(postId, comment.text || comment);

export const logUserInteraction = (data) => api.event(data);

export const fetchUserProfile = (username) => api.getUser(username);
