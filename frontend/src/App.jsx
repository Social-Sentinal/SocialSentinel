import React, { useEffect, useState, useRef } from 'react';
import {
  Home,
  Compass,
  MessageSquare,
  Users,
  Brain,
  BarChart3,
  User,
  Plus,
  Heart,
  Bookmark,
  Share2,
  Send,
  LogOut,
  Search,
  Sun,
  Moon,
  Sparkles,
  Trash2,
  HelpCircle,
  X,
  Flame,
  Sliders,
  Check,
  Smile
} from 'lucide-react';
import { api } from './services/api';
import MediaImage, { generateGradientSvg } from './components/MediaImage';

const NAV_TABS = [
  { id: 'feed', label: 'Home Feed', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'ai-studio', label: 'AI Studio', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

const TOPICS = [
  'All',
  'Astrophysics & Cosmos',
  'AI & Tech',
  'Web Dev',
  'Creative Arts',
  'Mindfulness'
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [theme, setTheme] = useState(localStorage.getItem('cosmos_theme') || 'dark');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Global modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [explainModalData, setExplainModalData] = useState(null);

  // Shared state for feed refresh
  const [feedTrigger, setFeedTrigger] = useState(0);
  const refreshFeed = () => setFeedTrigger(t => t + 1);

  // Load user profile on startup
  useEffect(() => {
    if (api.token) {
      api.me()
        .then(res => setUser(res.user))
        .catch(() => {
          api.logout();
          setUser(null);
        });
    }
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('cosmos_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  if (!user) {
    return <AuthView onLogin={setUser} />;
  }

  return (
    <div className="cosmos-app">
      {/* Left Navigation Rail */}
      <aside className="sidebar-rail">
        <div className="brand-logo" onClick={() => setActiveTab('feed')}>
          <div className="brand-icon-wrap">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="brand-title">COSMOS</div>
            <span className="brand-badge">AI Universe</span>
          </div>
        </div>

        <button className="create-post-btn" onClick={() => setCreateModalOpen(true)}>
          <Plus size={20} /> Create Post
        </button>

        <nav className="nav-menu">
          {NAV_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === 'messages' && unreadMessagesCount > 0 && (
                <span className="nav-badge">{unreadMessagesCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            <span>Theme Mode</span>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="user-snippet" onClick={() => setActiveTab('profile')}>
            <MediaImage
              src={user.avatar_url}
              fallbackText={user.display_name}
              isAvatar
              className="user-snippet-avatar"
            />
            <div className="user-snippet-info">
              <div className="user-snippet-name">{user.display_name}</div>
              <div className="user-snippet-handle">@{user.username}</div>
            </div>
            <button
              title="Log out"
              onClick={(e) => {
                e.stopPropagation();
                api.logout();
                setUser(null);
              }}
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Flow */}
      <div className="main-content-flow">
        <header className="top-app-header">
          <div className="header-title-bar">
            <div className="header-title">
              {NAV_TABS.find(t => t.id === activeTab)?.label || 'Cosmos'}
            </div>
          </div>

          <div className="header-search-wrap">
            <Search size={16} className="header-search-icon" />
            <input
              className="header-search-input"
              placeholder="Search posts, topics, creators…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveTab('explore');
                }
              }}
            />
          </div>
        </header>

        <div className="content-columns">
          {/* Active View Component */}
          {activeTab === 'feed' && (
            <FeedView
              user={user}
              feedTrigger={feedTrigger}
              refreshFeed={refreshFeed}
              onOpenShare={setSharePost}
              onOpenDetail={setDetailPost}
              onExplain={setExplainModalData}
            />
          )}
          {activeTab === 'explore' && (
            <ExploreView
              user={user}
              onOpenShare={setSharePost}
              onOpenDetail={setDetailPost}
              onExplain={setExplainModalData}
            />
          )}
          {activeTab === 'messages' && (
            <MessagesView user={user} sharePost={sharePost} onClearShare={() => setSharePost(null)} />
          )}
          {activeTab === 'communities' && (
            <CommunitiesView
              user={user}
              onSelectTopic={(topic) => {
                setActiveTab('feed');
              }}
            />
          )}
          {activeTab === 'ai-studio' && <AIStudioView user={user} />}
          {activeTab === 'analytics' && <AnalyticsView user={user} />}
          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              setUser={setUser}
              onOpenShare={setSharePost}
              onOpenDetail={setDetailPost}
              onExplain={setExplainModalData}
            />
          )}

          {/* Right Rail (Visible on Feed, Explore, Profile) */}
          {['feed', 'explore', 'profile'].includes(activeTab) && (
            <RightSidebarRail
              user={user}
              onTopicClick={(t) => {
                setActiveTab('feed');
              }}
              onRefreshFeed={refreshFeed}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        {NAV_TABS.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`mobile-nav-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Create Post Modal */}
      {createModalOpen && (
        <CreatePostModal
          user={user}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            setCreateModalOpen(false);
            refreshFeed();
          }}
        />
      )}

      {/* Share Post to Chat Modal */}
      {sharePost && (
        <ShareToChatModal
          user={user}
          post={sharePost}
          onClose={() => setSharePost(null)}
          onSuccess={() => {
            setSharePost(null);
            setActiveTab('messages');
          }}
        />
      )}

      {/* Post Detail / Comments Modal */}
      {detailPost && (
        <PostDetailModal
          user={user}
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onUpdate={refreshFeed}
          onOpenShare={(p) => {
            setDetailPost(null);
            setSharePost(p);
          }}
        />
      )}

      {/* AI Explanation Modal */}
      {explainModalData && (
        <div className="modal-backdrop" onClick={() => setExplainModalData(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="var(--primary)" /> Why Was This Recommended?
              </div>
              <button className="modal-close-btn" onClick={() => setExplainModalData(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 15, lineHeight: 1.6 }}>
                {explainModalData.response}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Signals: Engine verified content vectors, collaborative engagement velocity, and your topic preferences.
              </div>
              <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => setExplainModalData(null)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// FEED VIEW
// -------------------------------------------------------------
function FeedView({ user, feedTrigger, refreshFeed, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('For You');
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    try {
      if (selectedTopic === 'For You') {
        const res = await api.feed('?limit=25');
        // Extract post object and embed score/reason
        const formatted = (res.data || []).map(item => ({
          ...item.post,
          recommendation_reason: item.reason,
          recommendation_score: item.score
        }));
        setPosts(formatted);
      } else if (selectedTopic === 'Serendipity') {
        const res = await api.serendipityFeed('?limit=25');
        const formatted = (res.data || []).map(item => ({
          ...item.post,
          recommendation_reason: item.reason,
          recommendation_score: item.score
        }));
        setPosts(formatted);
      } else {
        const res = await api.posts(`?limit=25&topic=${encodeURIComponent(selectedTopic)}`);
        setPosts(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [selectedTopic, feedTrigger]);

  return (
    <div className="feed-column">
      {/* Quick Composer */}
      <QuickComposer user={user} onPosted={loadFeed} />

      {/* Category Pills */}
      <div className="category-filter-pills">
        {['For You', 'Serendipity', ...TOPICS.slice(1)].map(topic => (
          <button
            key={topic}
            className={`filter-pill ${selectedTopic === topic ? 'active' : ''}`}
            onClick={() => setSelectedTopic(topic)}
          >
            {topic === 'For You' ? '🎯 For You' : topic === 'Serendipity' ? '🌌 Serendipity' : topic}
          </button>
        ))}
      </div>

      {/* Feed Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <Sparkles className="spin" size={28} />
          <p style={{ marginTop: 10 }}>Calculating hybrid recommendations…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="cosmos-card" style={{ textAlign: 'center', padding: 40 }}>
          <h3>No posts found in this galaxy</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Be the first to publish a discovery in #{selectedTopic}!
          </p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            refresh={loadFeed}
            onOpenShare={onOpenShare}
            onOpenDetail={onOpenDetail}
            onExplain={onExplain}
          />
        ))
      )}
    </div>
  );
}

// -------------------------------------------------------------
// POST CARD COMPONENT
// -------------------------------------------------------------
function PostCard({ post, user, refresh, onOpenShare, onOpenDetail, onExplain }) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.counts?.likes || 0);
  const [saved, setSaved] = useState(post.saved);
  const [savesCount, setSavesCount] = useState(post.counts?.saves || 0);

  const handleLike = async () => {
    try {
      const res = await api.action(post.id, 'like');
      setLiked(res.result);
      setLikesCount(prev => (res.result ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.action(post.id, 'save');
      setSaved(res.result);
      setSavesCount(prev => (res.result ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExplain = async () => {
    try {
      const res = await api.explain(post.id);
      onExplain(res);
    } catch (err) {
      alert('Recommended based on your activity graph and content affinity.');
    }
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-author-link">
          <MediaImage
            src={post.author?.avatar_url}
            fallbackText={post.author?.display_name || 'A'}
            isAvatar
            className="post-avatar"
          />
          <div>
            <div className="post-author-name">{post.author?.display_name || 'Cosmos Creator'}</div>
            <div className="post-author-meta">
              <span>@{post.author?.username || 'user'}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {post.recommendation_reason && (
          <div className="post-rationale-badge">
            <Sparkles size={13} />
            <span>{post.recommendation_reason}</span>
          </div>
        )}
      </div>

      <p className="post-caption" onClick={() => onOpenDetail(post)} style={{ cursor: 'pointer' }}>
        {post.caption}
      </p>

      {post.hashtags && (
        <div className="post-hashtags">
          {post.hashtags.split(' ').map((tag, i) => (
            <span key={i}>{tag.startsWith('#') ? tag : '#' + tag}</span>
          ))}
        </div>
      )}

      {post.media_url && (
        <div className="post-media-wrap" onClick={() => onOpenDetail(post)} style={{ cursor: 'pointer' }}>
          <MediaImage src={post.media_url} fallbackText={post.caption} className="post-media" />
        </div>
      )}

      {/* Meta Chips */}
      <div className="post-meta-tags">
        <span className="meta-chip">#{post.topic}</span>
        {post.sentiment && (
          <span className={`meta-chip ${post.sentiment.toLowerCase()}`}>
            {post.sentiment === 'Positive' ? '✨' : post.sentiment === 'Negative' ? '⚠️' : '⚖️'} {post.sentiment}
            {post.sentiment_confidence ? ` (${Math.round(post.sentiment_confidence * 100)}%)` : ''}
          </span>
        )}
        {post.emotion && (
          <span className="meta-chip">
            🌿 {post.emotion.charAt(0).toUpperCase() + post.emotion.slice(1)}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="post-actions-bar">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>

        <button className="post-action-btn" onClick={() => onOpenDetail(post)}>
          <MessageSquare size={18} />
          <span>{post.counts?.comments || 0}</span>
        </button>

        <button className={`post-action-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          <span>{savesCount}</span>
        </button>

        <button className="post-action-btn" onClick={() => onOpenShare(post)}>
          <Share2 size={18} />
          <span>Share</span>
        </button>

        <button className="post-action-btn" onClick={handleExplain} title="Explain why this post is recommended">
          <Sparkles size={16} />
          <span>Why?</span>
        </button>
      </div>
    </article>
  );
}

// -------------------------------------------------------------
// QUICK COMPOSER
// -------------------------------------------------------------
function QuickComposer({ user, onPosted }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('Astrophysics & Cosmos');
  const [hashtags, setHashtags] = useState('');
  const [sentimentPreview, setSentimentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Live sentiment estimate on debounced typing
  useEffect(() => {
    if (!caption.trim() || caption.length < 5) {
      setSentimentPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const s = await api.predictSentiment(caption);
        setSentimentPreview(s);
      } catch (err) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [caption]);

  const handlePost = async () => {
    if (!caption.trim()) return;
    setSubmitting(true);
    try {
      await api.post({ caption, topic, hashtags });
      setCaption('');
      setHashtags('');
      setSentimentPreview(null);
      onPosted();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quick-composer">
      <div className="composer-top">
        <MediaImage
          src={user.avatar_url}
          fallbackText={user.display_name}
          isAvatar
          className="composer-avatar"
        />
        <textarea
          className="composer-textarea"
          placeholder="Share your discovery, theory, or cosmic thoughts with the universe…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      {sentimentPreview && (
        <div className="composer-sentiment-preview">
          <span>
            {sentimentPreview.sentiment === 'Positive' ? '✨' : sentimentPreview.sentiment === 'Negative' ? '⚠️' : '⚖️'}
          </span>
          <span>
            Tone: <b>{sentimentPreview.sentiment}</b> ({Math.round(sentimentPreview.confidence * 100)}% confidence)
          </span>
        </div>
      )}

      <div className="composer-bottom">
        <div className="composer-tools">
          <select className="topic-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.slice(1).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            placeholder="#hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              fontSize: 12,
              outline: 'none',
              width: 140
            }}
          />
        </div>

        <button className="btn-primary" disabled={submitting || !caption.trim()} onClick={handlePost}>
          <Send size={15} /> {submitting ? 'Posting…' : 'Publish'}
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MESSAGES VIEW (DIRECT MESSAGING + POST SHARING)
// -------------------------------------------------------------
function MessagesView({ user, sharePost, onClearShare }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await api.conversations();
      setConversations(res.data || []);
      if (!activeConvId && res.data?.length > 0) {
        setActiveConvId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (cid) => {
    if (!cid) return;
    try {
      const res = await api.messages(cid);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      // Auto-poll messages every 4 seconds
      const interval = setInterval(() => loadMessages(activeConvId), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearchUser = async (val) => {
    setUserSearch(val);
    if (!val.trim()) {
      setUserResults([]);
      return;
    }
    try {
      const res = await api.search(val);
      setUserResults((res.users || []).filter(u => u.id !== user.id));
    } catch (err) {}
  };

  const startNewChat = async (targetUser) => {
    try {
      const res = await api.createConversation([targetUser.id]);
      setUserSearch('');
      setUserResults([]);
      await loadConversations();
      setActiveConvId(res.conversation_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !sharePost) || !activeConvId) return;
    const sendText = text.trim();
    const sharedId = sharePost?.id || null;
    setText('');
    if (onClearShare) onClearShare();

    try {
      await api.sendMessage(activeConvId, sendText || 'Shared a post with you', sharedId);
      loadMessages(activeConvId);
      loadConversations();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherMember = activeConv?.members?.find(m => m.id !== user.id) || activeConv?.members?.[0];

  return (
    <div className="messenger-container" style={{ width: '100%' }}>
      {/* Conversations List Sidebar */}
      <div className="conversations-sidebar">
        <div className="conv-header">
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>Chats</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{conversations.length} total</span>
        </div>

        {/* User Search to initiate chat */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <input
            placeholder="Search creator to chat…"
            value={userSearch}
            onChange={(e) => handleSearchUser(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              outline: 'none',
              fontSize: 13
            }}
          />
          {userResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 50,
                left: 14,
                right: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 20,
                maxHeight: 200,
                overflowY: 'auto'
              }}
            >
              {userResults.map(u => (
                <div
                  key={u.id}
                  onClick={() => startNewChat(u)}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <MediaImage src={u.avatar_url} fallbackText={u.display_name} isAvatar style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{u.display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="conv-list">
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No messages yet. Search any creator above to start chatting!
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.members?.find(m => m.id !== user.id) || conv.members?.[0];
              return (
                <div
                  key={conv.id}
                  className={`conv-item ${conv.id === activeConvId ? 'active' : ''}`}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  <MediaImage
                    src={other?.avatar_url}
                    fallbackText={other?.display_name || 'U'}
                    isAvatar
                    className="conv-avatar"
                  />
                  <div className="conv-details">
                    <div className="conv-title">{other?.display_name || 'Direct Conversation'}</div>
                    <div className="conv-snippet">
                      {conv.last_message ? conv.last_message.body : 'Start chatting…'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Stage */}
      <div className="chat-stage">
        {activeConvId ? (
          <>
            <div className="chat-stage-header">
              <MediaImage
                src={otherMember?.avatar_url}
                fallbackText={otherMember?.display_name || 'U'}
                isAvatar
                style={{ width: 36, height: 36, borderRadius: '50%' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{otherMember?.display_name || 'Conversation'}</div>
                <div style={{ fontSize: 12, color: 'var(--accent-emerald)' }}>● Active on Cosmos</div>
              </div>
            </div>

            <div className="chat-messages-scroll">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Say hello to {otherMember?.display_name || 'this creator'}! ✨
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender?.id === user.id;
                  return (
                    <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="chat-bubble-sender">
                        {isMine ? 'You' : msg.sender?.display_name || 'Creator'}
                      </div>
                      <div>{msg.body}</div>

                      {/* Shared Post Preview Card */}
                      {msg.shared_post && (
                        <div className="chat-shared-post-card">
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700 }}>
                              📌 Post by @{msg.shared_post.author?.username}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                              {msg.shared_post.caption.slice(0, 110)}…
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="chat-bubble-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Shared post banner if user is sharing a post */}
            {sharePost && (
              <div style={{ padding: '8px 20px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                  📎 Sharing post: "{sharePost.caption.slice(0, 60)}…"
                </span>
                <button onClick={onClearShare} style={{ color: 'var(--primary)' }}><X size={16} /></button>
              </div>
            )}

            {/* Composer Box */}
            <div className="chat-composer-box">
              <input
                className="chat-input"
                placeholder="Write a message to send in real-time…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <button className="btn-primary" onClick={handleSend} disabled={!text.trim() && !sharePost}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select or start a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// EXPLORE VIEW
// -------------------------------------------------------------
function ExploreView({ user, onOpenShare, onOpenDetail, onExplain }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await api.search(val);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feed-column">
      <div className="cosmos-card">
        <h2 className="widget-title"><Compass size={22} color="var(--primary)" /> Cosmic Explorer</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 14 }}>
          Search creators, technical topics, exoplanet discoveries, and generative art across Cosmos.
        </p>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
          <input
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              outline: 'none',
              fontSize: 15
            }}
            placeholder="Type 'Astrophysics', 'JamesWebb', 'AI', or creator username…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Sparkles className="spin" size={24} /> Searching…
        </div>
      )}

      {/* People Results */}
      {results.users.length > 0 && (
        <div className="cosmos-card">
          <h3 className="widget-title">Creators Found</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {results.users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                <MediaImage src={u.avatar_url} fallbackText={u.display_name} isAvatar style={{ width: 38, height: 38, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.display_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Results */}
      {results.posts.map(p => (
        <PostCard
          key={p.id}
          post={p}
          user={user}
          refresh={() => handleSearch(query)}
          onOpenShare={onOpenShare}
          onOpenDetail={onOpenDetail}
          onExplain={onExplain}
        />
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// COMMUNITIES VIEW
// -------------------------------------------------------------
function CommunitiesView({ user, onSelectTopic }) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCommunities = async () => {
    try {
      const res = await api.communities();
      setCommunities(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleJoinToggle = async (cid) => {
    try {
      await api.joinCommunity(cid);
      loadCommunities();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="feed-column" style={{ maxWidth: 840 }}>
      <div className="cosmos-card">
        <h2 className="widget-title"><Users size={22} color="var(--primary)" /> Cosmos Communities</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Join focused clusters of creators and researchers exploring specialized dimensions of technology and the cosmos.
        </p>
      </div>

      <div className="communities-grid">
        {communities.map(comm => (
          <div key={comm.id} className="community-card">
            <div className="community-banner" style={{ background: comm.banner_gradient }}>
              {comm.icon}
            </div>
            <div className="community-body">
              <div className="community-name">{comm.name}</div>
              <div className="community-desc">{comm.description}</div>
              <div className="community-footer">
                <div className="community-members">
                  👥 {comm.members_count} members · 📝 {comm.posts_count} posts
                </div>
                <button
                  className={comm.is_member ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={() => handleJoinToggle(comm.id)}
                >
                  {comm.is_member ? 'Joined' : '+ Join'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// AI STUDIO VIEW (SENTIMENT INSPECTOR & COPILOT)
// -------------------------------------------------------------
function AIStudioView({ user }) {
  const [inputSentiment, setInputSentiment] = useState(
    'Exploring deep sky nebulae and observing proto-planetary disks with high-resolution spectroscopy.'
  );
  const [sentimentResult, setSentimentResult] = useState(null);
  const [emotionResult, setEmotionResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Copilot chat
  const [prompt, setPrompt] = useState('Why am I seeing these recommendations in my feed?');
  const [copilotResponse, setCopilotResponse] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  const runAnalysis = async () => {
    if (!inputSentiment.trim()) return;
    setAnalyzing(true);
    try {
      const [s, e] = await Promise.all([
        api.predictSentiment(inputSentiment),
        api.predictEmotion(inputSentiment)
      ]);
      setSentimentResult(s);
      setEmotionResult(e);
    } catch (err) {
      alert(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const handleAskCopilot = async () => {
    if (!prompt.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await api.ask(prompt);
      setCopilotResponse(res.response);
    } catch (err) {
      alert(err.message);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="feed-column" style={{ maxWidth: 960 }}>
      <div className="cosmos-card">
        <h2 className="widget-title"><Brain size={24} color="var(--primary)" /> Cosmos AI Studio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Inspect local scikit-learn models, analyze text sentiment distributions, and converse with your grounded AI Copilot.
        </p>
      </div>

      <div className="ai-studio-grid">
        {/* Left: Interactive Sentiment & Emotion Lab */}
        <div className="cosmos-card ai-sentiment-lab">
          <h3 className="widget-title"><Sparkles size={18} color="var(--accent-cyan)" /> NLP Sentiment Lab</h3>
          <textarea
            style={{
              width: '100%',
              minHeight: 110,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              outline: 'none',
              resize: 'vertical'
            }}
            value={inputSentiment}
            onChange={(e) => setInputSentiment(e.target.value)}
            placeholder="Type any caption or phrase to test live ML classification…"
          />

          <button className="btn-primary" onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? 'Analyzing…' : 'Run Scikit-Learn Model'}
          </button>

          {sentimentResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Predicted Sentiment:</span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: 13,
                    background:
                      sentimentResult.sentiment === 'Positive'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : sentimentResult.sentiment === 'Negative'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(148, 163, 184, 0.15)',
                    color:
                      sentimentResult.sentiment === 'Positive'
                        ? '#10b981'
                        : sentimentResult.sentiment === 'Negative'
                        ? '#ef4444'
                        : 'var(--text-secondary)'
                  }}
                >
                  {sentimentResult.sentiment} ({Math.round(sentimentResult.confidence * 100)}%)
                </span>
              </div>

              {/* Confidence breakdown bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Positive: {Math.round((sentimentResult.probabilities?.positive || 0) * 100)}%</span>
                  <span>Neutral: {Math.round((sentimentResult.probabilities?.neutral || 0) * 100)}%</span>
                  <span>Negative: {Math.round((sentimentResult.probabilities?.negative || 0) * 100)}%</span>
                </div>
                <div className="sentiment-gauge-bar">
                  <div
                    className="gauge-seg pos"
                    style={{ width: `${(sentimentResult.probabilities?.positive || 0) * 100}%` }}
                  />
                  <div
                    className="gauge-seg neu"
                    style={{ width: `${(sentimentResult.probabilities?.neutral || 0) * 100}%` }}
                  />
                  <div
                    className="gauge-seg neg"
                    style={{ width: `${(sentimentResult.probabilities?.negative || 0) * 100}%` }}
                  />
                </div>
              </div>

              {emotionResult && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontWeight: 700 }}>Detected Emotion:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)' }}>
                    🌿 {emotionResult.emotion.toUpperCase()} ({Math.round(emotionResult.confidence * 100)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: AI Copilot */}
        <div className="cosmos-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="widget-title"><Sparkles size={18} color="var(--primary)" /> Grounded AI Copilot</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Ask questions about why posts are recommended, discover your topic activity patterns, or explore platform algorithms.
          </p>

          <textarea
            style={{
              width: '100%',
              minHeight: 80,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              outline: 'none',
              resize: 'vertical'
            }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button className="btn-primary" onClick={handleAskCopilot} disabled={copilotLoading}>
            {copilotLoading ? 'Consulting Copilot…' : 'Ask AI Copilot'}
          </button>

          {copilotResponse && (
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                borderLeft: '4px solid var(--primary)'
              }}
            >
              {copilotResponse}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ANALYTICS VIEW
// -------------------------------------------------------------
function AnalyticsView({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="feed-column" style={{ textAlign: 'center', padding: 40 }}>
        <Sparkles className="spin" size={26} /> Loading Cosmos telemetry…
      </div>
    );
  }

  const topics = data?.topics || {};
  const maxTopicVal = Math.max(1, ...Object.values(topics));

  return (
    <div className="feed-column" style={{ maxWidth: 840 }}>
      <div className="cosmos-card">
        <h2 className="widget-title"><BarChart3 size={22} color="var(--primary)" /> Analytics & Graph Insights</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Real-time metrics derived from your likes, views, saves, follows, and topic engagements.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Interactions', val: data?.interactions || 0 },
          { label: 'Posts Created', val: data?.posts_created || 0 },
          { label: 'Followers', val: data?.followers_count || 0 },
          { label: 'Following', val: data?.following_count || 0 }
        ].map(m => (
          <div key={m.label} className="cosmos-card" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Topic Distribution */}
      <div className="cosmos-card">
        <h3 className="widget-title">Topic Engagement Distribution</h3>
        {Object.keys(topics).length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Interact with posts in the feed to build your interest distribution graph!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {Object.entries(topics).map(([topic, count]) => {
              const pct = Math.round((count / maxTopicVal) * 100);
              return (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>#{topic}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} signals</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PROFILE VIEW
// -------------------------------------------------------------
function ProfileView({ user, setUser, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: user.display_name || '',
    bio: user.bio || '',
    avatar_url: user.avatar_url || ''
  });

  const loadUserPosts = async () => {
    try {
      const res = await api.posts(`?author=${user.username}`);
      setPosts(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    loadUserPosts();
  }, [user]);

  const handleSave = async () => {
    try {
      const res = await api.updateUser(form);
      setUser(res.user);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="feed-column">
      <div className="cosmos-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <MediaImage
            src={user.avatar_url}
            fallbackText={user.display_name}
            isAvatar
            style={{ width: 80, height: 80, borderRadius: '50%' }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>{user.display_name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{user.username}</div>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
              {user.bio || 'No bio yet. Tap Edit to personalize your presence.'}
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <input
              placeholder="Display Name"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
            />
            <textarea
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', minHeight: 70 }}
            />
            <input
              placeholder="Avatar URL (Optional)"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
            />
            <button className="btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-start' }}>
              Save Changes
            </button>
          </div>
        )}
      </div>

      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginTop: 10 }}>Your Published Posts</h3>
      {posts.length === 0 ? (
        <div className="cosmos-card" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
          You haven't published any posts yet.
        </div>
      ) : (
        posts.map(p => (
          <PostCard
            key={p.id}
            post={p}
            user={user}
            refresh={loadUserPosts}
            onOpenShare={onOpenShare}
            onOpenDetail={onOpenDetail}
            onExplain={onExplain}
          />
        ))
      )}
    </div>
  );
}

// -------------------------------------------------------------
// RIGHT SIDEBAR RAIL (SERENDIPITY + COMMUNITIES + TRENDING)
// -------------------------------------------------------------
function RightSidebarRail({ user, onTopicClick, onRefreshFeed }) {
  const [serendipityRate, setSerendipityRate] = useState(25);
  const [suggestedCommunities, setSuggestedCommunities] = useState([]);

  useEffect(() => {
    api.communities().then(res => {
      setSuggestedCommunities((res.data || []).slice(0, 3));
    });
  }, []);

  const handleSliderChange = async (val) => {
    setSerendipityRate(val);
    try {
      await api.prefs({ exploration_rate: val / 100 });
      onRefreshFeed();
    } catch (err) {}
  };

  const handleJoin = async (cid) => {
    try {
      await api.joinCommunity(cid);
      const res = await api.communities();
      setSuggestedCommunities((res.data || []).slice(0, 3));
    } catch (err) {}
  };

  return (
    <aside className="right-sidebar-rail">
      {/* Serendipity Explorer */}
      <div className="serendipity-widget">
        <div className="serendipity-header">
          <span style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={15} color="var(--primary)" /> Serendipity Engine
          </span>
          <span className="serendipity-badge">{serendipityRate}% Explore</span>
        </div>
        <div className="serendipity-desc">
          Steers recommendations beyond your current bubble to surface unexpected insights.
        </div>
        <input
          type="range"
          min="5"
          max="80"
          value={serendipityRate}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="serendipity-slider"
        />
      </div>

      {/* Suggested Communities */}
      <div className="cosmos-card">
        <div className="widget-title">
          <Users size={17} color="var(--accent-purple)" />
          <span>Recommended Groups</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suggestedCommunities.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.members_count} members</div>
                </div>
              </div>
              <button
                className={c.is_member ? 'btn-secondary' : 'btn-primary'}
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => handleJoin(c.id)}
              >
                {c.is_member ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="cosmos-card">
        <div className="widget-title">
          <Flame size={17} color="var(--accent-pink)" />
          <span>Trending in Cosmos</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { tag: '#JamesWebb', posts: '4.2k discoveries' },
            { tag: '#MachineLearning', posts: '3.8k insights' },
            { tag: '#Astrobiology', posts: '1.9k discussions' },
            { tag: '#GenerativeDesign', posts: '1.4k creations' },
            { tag: '#DigitalWellbeing', posts: '980 reflections' }
          ].map(item => (
            <div key={item.tag} style={{ cursor: 'pointer' }} onClick={() => onTopicClick(item.tag)}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{item.tag}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.posts}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// -------------------------------------------------------------
// MODALS
// -------------------------------------------------------------

function CreatePostModal({ user, onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('Astrophysics & Cosmos');
  const [hashtags, setHashtags] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (caption.trim().length > 6) {
      const timer = setTimeout(async () => {
        try {
          const s = await api.predictSentiment(caption);
          setSentiment(s);
        } catch (err) {}
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [caption]);

  const handleSubmit = async () => {
    if (!caption.trim()) return;
    setSubmitting(true);
    try {
      await api.post({ caption, topic, hashtags });
      onCreated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create New Cosmos Post</div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <textarea
            placeholder="What is your cosmic discovery or insight?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ width: '100%', minHeight: 120, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          {sentiment && (
            <div className="composer-sentiment-preview">
              <span>{sentiment.sentiment === 'Positive' ? '✨' : sentiment.sentiment === 'Negative' ? '⚠️' : '⚖️'}</span>
              <span>Tone: <b>{sentiment.sentiment}</b> ({Math.round(sentiment.confidence * 100)}%)</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Topic Cluster</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', marginTop: 4 }}
              >
                {TOPICS.slice(1).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Hashtags</label>
              <input
                placeholder="#Cosmos #Science"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', marginTop: 4 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !caption.trim()}>
              {submitting ? 'Publishing…' : 'Publish Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareToChatModal({ user, post, onClose, onSuccess }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.conversations().then(res => {
      setConversations(res.data || []);
      setLoading(false);
    });
  }, []);

  const handleShareToConversation = async (cid) => {
    try {
      await api.sendMessage(cid, `Look at this post: "${post.caption.slice(0, 80)}…"`, post.id);
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Share Post to Direct Chat</div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 13, marginBottom: 10 }}>
            <b>Preview:</b> "{post.caption.slice(0, 120)}…"
          </div>

          <h4 style={{ fontSize: 14 }}>Select recipient thread:</h4>
          {loading ? (
            <p>Loading conversations…</p>
          ) : conversations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No active conversations yet. Visit Messages tab to connect with creators!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversations.map(conv => {
                const other = conv.members?.find(m => m.id !== user.id) || conv.members?.[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleShareToConversation(conv.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MediaImage src={other?.avatar_url} fallbackText={other?.display_name || 'U'} isAvatar style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{other?.display_name || 'Creator'}</span>
                    </div>
                    <span className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>Send</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostDetailModal({ user, post, onClose, onUpdate, onOpenShare }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    try {
      const res = await api.comments(post.id);
      setComments(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.comment(post.id, commentText);
      setCommentText('');
      loadComments();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div className="modal-title">Post & Discussion</div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <MediaImage src={post.author?.avatar_url} fallbackText={post.author?.display_name} isAvatar style={{ width: 44, height: 44, borderRadius: '50%' }} />
            <div>
              <div style={{ fontWeight: 700 }}>{post.author?.display_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{post.author?.username}</div>
            </div>
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 10 }}>
            {post.caption}
          </p>

          {post.media_url && (
            <div className="post-media-wrap">
              <MediaImage src={post.media_url} fallbackText={post.caption} className="post-media" />
            </div>
          )}

          <hr style={{ borderColor: 'var(--border)', margin: '14px 0' }} />

          <h4 style={{ fontSize: 15 }}>Comments ({comments.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No comments yet. Share your perspective below!</div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{c.user?.display_name || 'Creator'}</div>
                  <div style={{ fontSize: 14, marginTop: 2 }}>{c.text}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              placeholder="Add your comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment();
              }}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
            <button className="btn-primary" onClick={handleAddComment} disabled={submitting || !commentText.trim()}>
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// AUTHENTICATION VIEW
// -------------------------------------------------------------
function AuthView({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth(mode, form);
      onLogin(res.user);
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.demoLogin();
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <div className="brand-icon-wrap">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="brand-title" style={{ fontSize: 26 }}>COSMOS</div>
            <span className="brand-badge">AI Social Network</span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>
            {mode === 'login' ? 'Welcome Back Explorer' : 'Join the Cosmos Universe'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Direct messaging, intelligent hybrid recommendations, and sentiment awareness.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-label">Username</label>
              <input
                className="auth-input"
                required
                placeholder="astronomer_99"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">{mode === 'login' ? 'Email or Username' : 'Email Address'}</label>
            <input
              className="auth-input"
              required
              placeholder="you@cosmos.social"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {mode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-label">Display Name</label>
              <input
                className="auth-input"
                placeholder="Dr. Eleanor Vance"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="btn-primary" style={{ justifyContent: 'center', padding: 13, marginTop: 6 }} disabled={loading}>
            {loading ? 'Authenticating…' : mode === 'login' ? 'Enter Cosmos' : 'Create Cosmos Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}
          >
            {mode === 'login' ? 'Need an account? Register here' : 'Already have an account? Log in'}
          </button>
        </div>

        <div className="demo-login-box">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick Assessment & Testing</span>
          <button
            onClick={handleDemoLogin}
            className="btn-secondary"
            style={{ justifyContent: 'center', padding: 11, fontWeight: 700 }}
            disabled={loading}
          >
            🚀 Try Demo Account (Cosmos Explorer)
          </button>
        </div>
      </div>
    </div>
  );
}
