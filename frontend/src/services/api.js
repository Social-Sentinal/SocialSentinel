const BASE = import.meta.env.VITE_API_URL || '/api/v1';

let access = localStorage.getItem('cosmos_access') || localStorage.getItem('ss_access');
const refresh = () => localStorage.getItem('cosmos_refresh') || localStorage.getItem('ss_refresh');

function formatQuery(params) {
  if (!params) return '';
  if (typeof params === 'string') {
    return params.startsWith('?') ? params : `?${params}`;
  }
  if (typeof params === 'object') {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        sp.append(k, v);
      }
    }
    const qs = sp.toString();
    return qs ? `?${qs}` : '';
  }
  return '';
}

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
    // empty body
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
  getTopicPreferences: () => request('/users/topic-preferences'),
  resetTopicPreferences: () => request('/users/topic-preferences/reset', { method: 'POST' }),
  follow: (userId) => request(`/users/${userId}/follow`, { method: 'POST' }),
  block: (userId) => request(`/users/${userId}/block`, { method: 'POST' }),

  // Posts & Feed
  posts: (params = '') => request('/posts' + formatQuery(params)),
  feed: (params = '') => request('/recommendations/feed' + formatQuery(params)),
  serendipityFeed: (params = '') => request('/recommendations/serendipity' + formatQuery(params)),
  post: (body) => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  action: (id, act) => request(`/posts/${id}/${act}`, { method: 'POST' }),
  report: (id, reason, details = '') => request(`/posts/${id}/report`, { method: 'POST', body: JSON.stringify({ reason, details }) }),
  comments: (id) => request(`/posts/${id}/comments`),
  comment: (id, text, parentId = null) =>
    request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text, parent_id: parentId }) }),
  event: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),

  // Recommendations & Explainability
  explain: (postId) => request(`/recommendations/explain/${postId}`),

  // Search & Trending
  search: (q) => request('/search?q=' + encodeURIComponent(q)),
  trending: () => request('/search/trending'),
  communities: () => request('/communities'),
  joinCommunity: (id) => request(`/communities/${id}/join`, { method: 'POST' }),
  communityPosts: (slug, params = '') => request(`/communities/${slug}/posts` + formatQuery(params)),

  // Analytics & Notifications
  analytics: () => request('/analytics/overview'),
  notifications: () => request('/notifications'),
  readAll: () => request('/notifications/read-all', { method: 'POST' }),

  // AI & Sentiment
  predictSentiment: (text) => request('/sentiment/predict', { method: 'POST', body: JSON.stringify({ text }) }),
  predictEmotion: (text) => request('/sentiment/emotion', { method: 'POST', body: JSON.stringify({ text }) }),
  sentimentHistory: () => request('/sentiment/history'),
  ask: (prompt) => request('/ai/ask', { method: 'POST', body: JSON.stringify({ prompt }) }),
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
