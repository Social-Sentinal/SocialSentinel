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
  Shield,
  Sparkles,
  X,
  Flame,
  Sliders,
  Check
} from 'lucide-react';
import { api } from './services/api';
import MediaImage from './components/MediaImage';

const NAV_TABS = [
  { id: 'feed', label: 'Home Feed', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'ai-studio', label: 'AI Studio', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User }
];

const TOPICS = [
  'All',
  'AI & Tech',
  'Cybersecurity & Privacy',
  'Web Engineering',
  'Creative Tech & Design',
  'Digital Wellbeing'
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [theme, setTheme] = useState(localStorage.getItem('sentinel_theme') || 'dark');
  const [unreadCount, setUnreadCount] = useState(0);

  // Global modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [explainModalData, setExplainModalData] = useState(null);

  // Feed trigger
  const [feedTrigger, setFeedTrigger] = useState(0);
  const refreshFeed = () => setFeedTrigger(t => t + 1);

  // Load user
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
    localStorage.setItem('sentinel_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  if (!user) {
    return <AuthView onLogin={setUser} />;
  }

  return (
    <div className="app-container">
      {/* Left Sidebar Rail */}
      <aside className="app-sidebar">
        <div className="brand-section" onClick={() => setActiveTab('feed')}>
          <div className="brand-shield-icon">
            <Shield size={22} />
          </div>
          <div className="brand-text-block">
            <div className="brand-name">SocialSentinel</div>
            <span className="brand-sub">AI Social Network</span>
          </div>
        </div>

        <button className="sidebar-action-btn" onClick={() => setCreateModalOpen(true)}>
          <Plus size={18} /> Create Post
        </button>

        <nav className="sidebar-nav">
          {NAV_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'messages' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--accent-pink)', color: 'white', padding: '2px 7px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-user-footer">
          <button className="theme-button" onClick={toggleTheme}>
            <span>Theme Mode</span>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="user-profile-summary" onClick={() => setActiveTab('profile')}>
            <MediaImage
              src={user.avatar_url}
              fallbackText={user.display_name}
              isAvatar
              className="user-summary-avatar"
            />
            <div className="user-summary-text">
              <div className="user-summary-name">{user.display_name}</div>
              <div className="user-summary-handle">@{user.username}</div>
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
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="app-viewport">
        <header className="viewport-header">
          <div className="header-title-text">
            {NAV_TABS.find(t => t.id === activeTab)?.label || 'SocialSentinel'}
          </div>

          <div className="header-search-container">
            <Search size={15} className="header-search-icon" />
            <input
              className="header-search-field"
              placeholder="Search posts, topics, creators…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveTab('explore');
              }}
            />
          </div>
        </header>

        {/* Content Views */}
        {activeTab === 'feed' && (
          <div className="page-layout-split">
            <div className="main-column">
              <QuickComposer user={user} onPosted={refreshFeed} />
              <FeedStream
                user={user}
                feedTrigger={feedTrigger}
                refreshFeed={refreshFeed}
                onOpenShare={setSharePost}
                onOpenDetail={setDetailPost}
                onExplain={setExplainModalData}
              />
            </div>
            <RightSidebarRail
              user={user}
              onTopicClick={() => setActiveTab('feed')}
              onRefreshFeed={refreshFeed}
            />
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="page-layout-split">
            <div className="main-column">
              <ExploreStream
                user={user}
                onOpenShare={setSharePost}
                onOpenDetail={setDetailPost}
                onExplain={setExplainModalData}
              />
            </div>
            <RightSidebarRail
              user={user}
              onTopicClick={() => setActiveTab('feed')}
              onRefreshFeed={refreshFeed}
            />
          </div>
        )}

        {activeTab === 'messages' && (
          <MessengerView
            user={user}
            sharePost={sharePost}
            onClearShare={() => setSharePost(null)}
          />
        )}

        {activeTab === 'communities' && (
          <CommunitiesPage
            user={user}
            onSelectTopic={() => setActiveTab('feed')}
          />
        )}

        {activeTab === 'ai-studio' && <AIStudioPage user={user} />}

        {activeTab === 'analytics' && <AnalyticsPage user={user} />}

        {activeTab === 'profile' && (
          <div className="page-layout-split">
            <div className="main-column">
              <ProfileStream
                user={user}
                setUser={setUser}
                onOpenShare={setSharePost}
                onOpenDetail={setDetailPost}
                onExplain={setExplainModalData}
              />
            </div>
            <RightSidebarRail
              user={user}
              onTopicClick={() => setActiveTab('feed')}
              onRefreshFeed={refreshFeed}
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-bar">
        {NAV_TABS.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`mobile-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
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

      {explainModalData && (
        <div className="modal-overlay" onClick={() => setExplainModalData(null)}>
          <div className="modal-content-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16 }}>
                <Shield size={18} color="var(--primary)" /> Why Was This Recommended?
              </div>
              <button onClick={() => setExplainModalData(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body-content">
              <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 14, lineHeight: 1.6 }}>
                {explainModalData.response}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Signals: Engine verified TF-IDF vector alignment, collaborative weights, and your active topic preferences.
              </div>
              <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => setExplainModalData(null)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// FEED STREAM & COMPOSER
// -------------------------------------------------------------
function FeedStream({ user, feedTrigger, refreshFeed, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('For You');
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    try {
      if (selectedTopic === 'For You') {
        const res = await api.feed('?limit=25');
        const formatted = (res.data || []).map(item => ({
          ...item.post,
          recommendation_reason: item.reason,
          recommendation_score: item.score
        }));
        setPosts(formatted);
      } else if (selectedTopic === 'Discover') {
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
    loadPosts();
  }, [selectedTopic, feedTrigger]);

  return (
    <>
      <div className="topic-pills-row">
        {['For You', 'Discover', ...TOPICS.slice(1)].map(t => (
          <button
            key={t}
            className={`topic-pill ${selectedTopic === t ? 'active' : ''}`}
            onClick={() => setSelectedTopic(t)}
          >
            {t === 'For You' ? '🎯 For You' : t === 'Discover' ? '✨ Discover' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={24} />
          <p style={{ marginTop: 8, fontSize: 14 }}>Calculating intelligent recommendations…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="sentinel-card" style={{ textAlign: 'center', padding: 36 }}>
          <h3>No posts found in this section</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            Be the first to share an insight in #{selectedTopic}!
          </p>
        </div>
      ) : (
        posts.map(post => (
          <PostCardItem
            key={post.id}
            post={post}
            user={user}
            refresh={loadPosts}
            onOpenShare={onOpenShare}
            onOpenDetail={onOpenDetail}
            onExplain={onExplain}
          />
        ))
      )}
    </>
  );
}

function QuickComposer({ user, onPosted }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
  const [hashtags, setHashtags] = useState('');
  const [sentimentPreview, setSentimentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    }, 350);
    return () => clearTimeout(timer);
  }, [caption]);

  const handlePublish = async () => {
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
    <div className="composer-card">
      <div className="composer-input-row">
        <MediaImage
          src={user.avatar_url}
          fallbackText={user.display_name}
          isAvatar
          className="composer-avatar"
        />
        <textarea
          className="composer-textarea"
          placeholder="Share your thoughts, discoveries, or questions on SocialSentinel…"
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
      </div>

      {sentimentPreview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--bg-elevated)', width: 'fit-content' }}>
          <span>{sentimentPreview.sentiment === 'Positive' ? '✨' : sentimentPreview.sentiment === 'Negative' ? '⚠️' : '⚖️'}</span>
          <span>Tone: <b>{sentimentPreview.sentiment}</b> ({Math.round(sentimentPreview.confidence * 100)}%)</span>
        </div>
      )}

      <div className="composer-footer">
        <div className="composer-controls">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12, outline: 'none' }}
          >
            {TOPICS.slice(1).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            placeholder="#tags"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12, outline: 'none', width: 130 }}
          />
        </div>

        <button className="btn-primary" disabled={submitting || !caption.trim()} onClick={handlePublish}>
          <Send size={14} /> {submitting ? 'Posting…' : 'Publish'}
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// POST CARD ITEM
// -------------------------------------------------------------
function PostCardItem({ post, user, refresh, onOpenShare, onOpenDetail, onExplain }) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.counts?.likes || 0);
  const [saved, setSaved] = useState(post.saved);
  const [savesCount, setSavesCount] = useState(post.counts?.saves || 0);

  const handleLike = async () => {
    try {
      const res = await api.action(post.id, 'like');
      setLiked(res.result);
      setLikesCount(c => (res.result ? c + 1 : Math.max(0, c - 1)));
    } catch (err) {}
  };

  const handleSave = async () => {
    try {
      const res = await api.action(post.id, 'save');
      setSaved(res.result);
      setSavesCount(c => (res.result ? c + 1 : Math.max(0, c - 1)));
    } catch (err) {}
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
    <article className="post-item">
      <div className="post-author-row">
        <div className="post-author-info">
          <MediaImage
            src={post.author?.avatar_url}
            fallbackText={post.author?.display_name || 'A'}
            isAvatar
            className="post-author-avatar"
          />
          <div>
            <div className="post-author-name">{post.author?.display_name || 'Creator'}</div>
            <div className="post-author-sub">
              <span>@{post.author?.username || 'user'}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {post.recommendation_reason && (
          <div className="post-justification-chip">
            <Shield size={12} />
            <span>{post.recommendation_reason}</span>
          </div>
        )}
      </div>

      <p className="post-body-text" onClick={() => onOpenDetail(post)} style={{ cursor: 'pointer' }}>
        {post.caption}
      </p>

      {post.hashtags && (
        <div className="post-tags-list">
          {post.hashtags.split(' ').map((t, idx) => (
            <span key={idx}>{t.startsWith('#') ? t : '#' + t}</span>
          ))}
        </div>
      )}

      {post.media_url && (
        <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 420, cursor: 'pointer' }} onClick={() => onOpenDetail(post)}>
          <MediaImage src={post.media_url} fallbackText={post.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div className="post-chips-bar">
        <span className="chip">#{post.topic}</span>
        {post.sentiment && (
          <span className={`chip ${post.sentiment.toLowerCase()}`}>
            {post.sentiment === 'Positive' ? '✨' : post.sentiment === 'Negative' ? '⚠️' : '⚖️'} {post.sentiment}
            {post.sentiment_confidence ? ` (${Math.round(post.sentiment_confidence * 100)}%)` : ''}
          </span>
        )}
        {post.emotion && (
          <span className="chip">
            🌿 {post.emotion.charAt(0).toUpperCase() + post.emotion.slice(1)}
          </span>
        )}
      </div>

      <div className="post-actions-row">
        <button className={`action-pill-btn ${liked ? 'active-like' : ''}`} onClick={handleLike}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>

        <button className="action-pill-btn" onClick={() => onOpenDetail(post)}>
          <MessageSquare size={16} />
          <span>{post.counts?.comments || 0}</span>
        </button>

        <button className={`action-pill-btn ${saved ? 'active-save' : ''}`} onClick={handleSave}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          <span>{savesCount}</span>
        </button>

        <button className="action-pill-btn" onClick={() => onOpenShare(post)}>
          <Share2 size={16} />
          <span>Share</span>
        </button>

        <button className="action-pill-btn" onClick={handleExplain} title="Explain why this post was recommended">
          <Shield size={14} />
          <span>Why?</span>
        </button>
      </div>
    </article>
  );
}

// -------------------------------------------------------------
// RIGHT SIDEBAR RAIL (STICKY, ZERO MIDDLE SCROLLBAR)
// -------------------------------------------------------------
function RightSidebarRail({ user, onTopicClick, onRefreshFeed }) {
  const [explorationRate, setExplorationRate] = useState(20);
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    api.communities().then(res => {
      setCommunities((res.data || []).slice(0, 3));
    });
  }, []);

  const handleSlider = async val => {
    setExplorationRate(val);
    try {
      await api.prefs({ exploration_rate: val / 100 });
      onRefreshFeed();
    } catch (err) {}
  };

  const handleJoin = async cid => {
    try {
      await api.joinCommunity(cid);
      const res = await api.communities();
      setCommunities((res.data || []).slice(0, 3));
    } catch (err) {}
  };

  return (
    <aside className="side-column">
      {/* Exploration Slider Widget */}
      <div className="sentinel-card" style={{ background: 'linear-gradient(135deg, var(--primary-light), rgba(14, 165, 233, 0.08))', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={14} color="var(--primary)" /> Discovery Steerer
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--primary)', color: 'white' }}>
            {explorationRate}%
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
          Adjusts serendipity to explore topics beyond your direct interaction history.
        </p>
        <input
          type="range"
          min="5"
          max="80"
          value={explorationRate}
          onChange={e => handleSlider(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
      </div>

      {/* Suggested Communities */}
      <div className="sentinel-card">
        <div className="card-heading">
          <Users size={16} color="var(--accent-purple)" />
          <span>Recommended Communities</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {communities.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.members_count} members</div>
                </div>
              </div>
              <button
                className={c.is_member ? 'btn-secondary' : 'btn-primary'}
                style={{ padding: '3px 9px', fontSize: 11 }}
                onClick={() => handleJoin(c.id)}
              >
                {c.is_member ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="sentinel-card">
        <div className="card-heading">
          <Flame size={16} color="var(--accent-pink)" />
          <span>Trending on SocialSentinel</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { tag: '#SocialSentinel', count: '5.1k discussions' },
            { tag: '#MachineLearning', count: '4.3k posts' },
            { tag: '#WebEngineering', count: '2.8k updates' },
            { tag: '#Cybersecurity', count: '1.9k alerts' },
            { tag: '#DigitalWellbeing', count: '1.2k reflections' }
          ].map(item => (
            <div key={item.tag} style={{ cursor: 'pointer' }} onClick={() => onTopicClick(item.tag)}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{item.tag}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// -------------------------------------------------------------
// MESSAGES VIEW
// -------------------------------------------------------------
function MessengerView({ user, sharePost, onClearShare }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const endRef = useRef(null);

  const loadConvs = async () => {
    try {
      const res = await api.conversations();
      setConversations(res.data || []);
      if (!activeConvId && res.data?.length > 0) {
        setActiveConvId(res.data[0].id);
      }
    } catch (err) {}
  };

  const loadMessages = async (cid) => {
    if (!cid) return;
    try {
      const res = await api.messages(cid);
      setMessages(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    loadConvs();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const interval = setInterval(() => loadMessages(activeConvId), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearchUser = async val => {
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
      await loadConvs();
      setActiveConvId(res.conversation_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !sharePost) || !activeConvId) return;
    const msgText = text.trim();
    const sharedId = sharePost?.id || null;
    setText('');
    if (onClearShare) onClearShare();

    try {
      await api.sendMessage(activeConvId, msgText || 'Shared a post with you', sharedId);
      loadMessages(activeConvId);
      loadConvs();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherMember = activeConv?.members?.find(m => m.id !== user.id) || activeConv?.members?.[0];

  return (
    <div className="messenger-frame">
      <div className="conversations-pane">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 16 }}>
          Direct Conversations
        </div>

        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <input
            placeholder="Search creator to message…"
            value={userSearch}
            onChange={e => handleSearchUser(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none', fontSize: 13 }}
          />
          {userResults.length > 0 && (
            <div style={{ position: 'absolute', top: 52, left: 14, right: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 30, maxHeight: 180, overflowY: 'auto' }}>
              {userResults.map(u => (
                <div
                  key={u.id}
                  onClick={() => startNewChat(u)}
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
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

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No active conversations yet.
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.members?.find(m => m.id !== user.id) || conv.members?.[0];
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: conv.id === activeConvId ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  <MediaImage src={other?.avatar_url} fallbackText={other?.display_name || 'U'} isAvatar style={{ width: 38, height: 38, borderRadius: '50%' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {other?.display_name || 'Conversation'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.last_message ? conv.last_message.body : 'Start chatting…'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="chat-stage-pane">
        {activeConvId ? (
          <>
            <div className="chat-stage-header">
              <MediaImage src={otherMember?.avatar_url} fallbackText={otherMember?.display_name || 'U'} isAvatar style={{ width: 34, height: 34, borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{otherMember?.display_name || 'Direct Chat'}</div>
                <div style={{ fontSize: 11, color: 'var(--accent-emerald)' }}>● Active on SocialSentinel</div>
              </div>
            </div>

            <div className="chat-scroll-area">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  Send a message to start communicating!
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender?.id === user.id;
                  return (
                    <div key={m.id} className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>
                        {isMine ? 'You' : m.sender?.display_name || 'Creator'}
                      </div>
                      <div>{m.body}</div>

                      {m.shared_post && (
                        <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: isMine ? 'rgba(0,0,0,0.12)' : 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>📌 Post by @{m.shared_post.author?.username}</div>
                          <div style={{ fontSize: 12, marginTop: 2 }}>{m.shared_post.caption.slice(0, 100)}…</div>
                        </div>
                      )}

                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {sharePost && (
              <div style={{ padding: '8px 18px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                  📎 Attached post: "{sharePost.caption.slice(0, 60)}…"
                </span>
                <button onClick={onClearShare} style={{ color: 'var(--primary)' }}><X size={15} /></button>
              </div>
            )}

            <div className="chat-composer-strip">
              <input
                placeholder="Write a message…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
              />
              <button className="btn-primary" onClick={handleSend} disabled={!text.trim() && !sharePost}>
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select a conversation to begin chatting.
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// EXPLORE STREAM
// -------------------------------------------------------------
function ExploreStream({ user, onOpenShare, onOpenDetail, onExplain }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);

  const doSearch = async val => {
    setQuery(val);
    if (!val.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await api.search(val);
      setResults(res);
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sentinel-card">
        <h2 className="card-heading"><Compass size={20} color="var(--primary)" /> SocialSentinel Explorer</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
          Find technical insights, research updates, security advisories, and creators across the network.
        </p>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
          <input
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none', fontSize: 14 }}
            placeholder="Search keywords, #hashtags, or usernames…"
            value={query}
            onChange={e => doSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Sparkles size={20} /> Searching SocialSentinel…
        </div>
      )}

      {results.users.length > 0 && (
        <div className="sentinel-card">
          <h3 className="card-heading">Creators</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {results.users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: 'var(--bg-elevated)' }}>
                <MediaImage src={u.avatar_url} fallbackText={u.display_name} isAvatar style={{ width: 34, height: 34, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.display_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.posts.map(p => (
        <PostCardItem
          key={p.id}
          post={p}
          user={user}
          refresh={() => doSearch(query)}
          onOpenShare={onOpenShare}
          onOpenDetail={onOpenDetail}
          onExplain={onExplain}
        />
      ))}
    </>
  );
}

// -------------------------------------------------------------
// COMMUNITIES PAGE
// -------------------------------------------------------------
function CommunitiesPage({ user }) {
  const [communities, setCommunities] = useState([]);

  const load = async () => {
    try {
      const res = await api.communities();
      setCommunities(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async cid => {
    try {
      await api.joinCommunity(cid);
      load();
    } catch (err) {}
  };

  return (
    <div className="fullwidth-page">
      <div className="sentinel-card">
        <h2 className="card-heading"><Users size={22} color="var(--primary)" /> SocialSentinel Communities</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Join focused clusters of creators and researchers exploring specialized domains of technology and digital wellbeing.
        </p>
      </div>

      <div className="communities-collection">
        {communities.map(c => (
          <div key={c.id} className="community-panel">
            <div className="community-banner-strip" style={{ background: c.banner_gradient }}>
              {c.icon}
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{c.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👥 {c.members_count} members</span>
                <button
                  className={c.is_member ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => handleToggle(c.id)}
                >
                  {c.is_member ? 'Joined' : '+ Join'}
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
// AI STUDIO PAGE
// -------------------------------------------------------------
function AIStudioPage({ user }) {
  const [text, setText] = useState('Sub-15ms local inference is a huge milestone for user privacy and resilient architecture.');
  const [sentiment, setSentiment] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [prompt, setPrompt] = useState('Why am I seeing these recommendations in my feed?');
  const [copilotReply, setCopilotReply] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  const runNlp = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    try {
      const [s, e] = await Promise.all([
        api.predictSentiment(text),
        api.predictEmotion(text)
      ]);
      setSentiment(s);
      setEmotion(e);
    } catch (err) {}
    finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runNlp();
  }, []);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await api.ask(prompt);
      setCopilotReply(res.response);
    } catch (err) {
      alert(err.message);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="fullwidth-page">
      <div className="sentinel-card">
        <h2 className="card-heading"><Brain size={22} color="var(--primary)" /> SocialSentinel AI Studio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Real-time Scikit-Learn TF-IDF classification and grounded conversational intelligence.
        </p>
      </div>

      <div className="ai-columns-grid">
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="card-heading"><Sparkles size={16} color="var(--accent-cyan)" /> NLP Sentiment Analyzer</h3>
          <textarea
            style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button className="btn-primary" onClick={runNlp} disabled={analyzing} style={{ alignSelf: 'flex-start' }}>
            {analyzing ? 'Analyzing…' : 'Run Scikit-Learn Prediction'}
          </button>

          {sentiment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Classification:</span>
                <span className={`chip ${sentiment.sentiment.toLowerCase()}`} style={{ fontSize: 13 }}>
                  {sentiment.sentiment} ({Math.round(sentiment.confidence * 100)}%)
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Positive: {Math.round((sentiment.probabilities?.positive || 0) * 100)}%</span>
                  <span>Neutral: {Math.round((sentiment.probabilities?.neutral || 0) * 100)}%</span>
                  <span>Negative: {Math.round((sentiment.probabilities?.negative || 0) * 100)}%</span>
                </div>
                <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-elevated)', marginTop: 6 }}>
                  <div style={{ width: `${(sentiment.probabilities?.positive || 0) * 100}%`, background: '#059669' }} />
                  <div style={{ width: `${(sentiment.probabilities?.neutral || 0) * 100}%`, background: '#64748b' }} />
                  <div style={{ width: `${(sentiment.probabilities?.negative || 0) * 100}%`, background: '#ef4444' }} />
                </div>
              </div>

              {emotion && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Emotion:</span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                    🌿 {emotion.emotion.toUpperCase()} ({Math.round(emotion.confidence * 100)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="card-heading"><Shield size={16} color="var(--primary)" /> Grounded AI Copilot</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Ask questions about recommendations, topic affinity trends, or platform mechanics.
          </p>

          <textarea
            style={{ width: '100%', minHeight: 70, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />

          <button className="btn-primary" onClick={handleAsk} disabled={copilotLoading} style={{ alignSelf: 'flex-start' }}>
            {copilotLoading ? 'Consulting…' : 'Ask Copilot'}
          </button>

          {copilotReply && (
            <div style={{ padding: 14, borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 13, lineHeight: 1.6, borderLeft: '3px solid var(--primary)' }}>
              {copilotReply}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ANALYTICS PAGE
// -------------------------------------------------------------
function AnalyticsPage({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.analytics().then(res => setData(res.data)).catch(console.error);
  }, []);

  const topics = data?.topics || {};
  const maxVal = Math.max(1, ...Object.values(topics));

  return (
    <div className="fullwidth-page">
      <div className="sentinel-card">
        <h2 className="card-heading"><BarChart3 size={22} color="var(--primary)" /> Engagement & Telemetry</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Live metrics from your likes, views, saves, follows, and topic engagements on SocialSentinel.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Interactions', val: data?.interactions || 0 },
          { label: 'Posts Created', val: data?.posts_created || 0 },
          { label: 'Followers', val: data?.followers_count || 0 },
          { label: 'Following', val: data?.following_count || 0 }
        ].map(m => (
          <div key={m.label} className="sentinel-card" style={{ textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div className="sentinel-card">
        <h3 className="card-heading">Topic Engagement Signals</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          {Object.entries(topics).map(([topic, count]) => (
            <div key={topic}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>#{topic}</span>
                <span style={{ color: 'var(--text-muted)' }}>{count} signals</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((count / maxVal) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PROFILE STREAM
// -------------------------------------------------------------
function ProfileStream({ user, setUser, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: user.display_name || '',
    bio: user.bio || '',
    avatar_url: user.avatar_url || ''
  });

  const loadPosts = async () => {
    try {
      const res = await api.posts(`?author=${user.username}`);
      setPosts(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    loadPosts();
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
    <>
      <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <MediaImage
            src={user.avatar_url}
            fallbackText={user.display_name}
            isAvatar
            style={{ width: 72, height: 72, borderRadius: '50%' }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>{user.display_name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{user.username}</div>
            <p style={{ marginTop: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
              {user.bio || 'No bio yet. Tap Edit Profile to customize.'}
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <input
              placeholder="Display Name"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
            />
            <textarea
              placeholder="Bio"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', minHeight: 60 }}
            />
            <button className="btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-start' }}>
              Save Profile
            </button>
          </div>
        )}
      </div>

      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, marginTop: 6 }}>Your Published Posts</h3>
      {posts.map(p => (
        <PostCardItem
          key={p.id}
          post={p}
          user={user}
          refresh={loadPosts}
          onOpenShare={onOpenShare}
          onOpenDetail={onOpenDetail}
          onExplain={onExplain}
        />
      ))}
    </>
  );
}

// -------------------------------------------------------------
// MODALS
// -------------------------------------------------------------
function CreatePostModal({ user, onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Create New Post</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="modal-body-content">
          <textarea
            placeholder="Share your insight with SocialSentinel…"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ width: '100%', minHeight: 110, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          {sentiment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <span>Tone:</span>
              <span className={`chip ${sentiment.sentiment.toLowerCase()}`}>
                {sentiment.sentiment} ({Math.round(sentiment.confidence * 100)}%)
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Topic</label>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', marginTop: 4 }}
              >
                {TOPICS.slice(1).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Hashtags</label>
              <input
                placeholder="#AI #Dev"
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', marginTop: 4 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
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

  const handleSendToConv = async cid => {
    try {
      await api.sendMessage(cid, `Check this out: "${post.caption.slice(0, 80)}…"`, post.id);
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Share to Chat</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="modal-body-content">
          <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 13 }}>
            <b>Attached:</b> "{post.caption.slice(0, 100)}…"
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Select recipient:</div>
          {loading ? (
            <p style={{ fontSize: 13 }}>Loading…</p>
          ) : conversations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No open conversations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversations.map(conv => {
                const other = conv.members?.find(m => m.id !== user.id) || conv.members?.[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSendToConv(conv.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MediaImage src={other?.avatar_url} fallbackText={other?.display_name || 'U'} isAvatar style={{ width: 30, height: 30, borderRadius: '50%' }} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{other?.display_name || 'Creator'}</span>
                    </div>
                    <span className="btn-primary" style={{ padding: '3px 9px', fontSize: 11 }}>Send</span>
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
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await api.comments(post.id);
      setComments(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    load();
  }, [post.id]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.comment(post.id, text);
      setText('');
      load();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header-bar">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Post Discussion</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="modal-body-content">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <MediaImage src={post.author?.avatar_url} fallbackText={post.author?.display_name} isAvatar style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{post.author?.display_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{post.author?.username}</div>
            </div>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {post.caption}
          </p>

          <hr style={{ borderColor: 'var(--border)' }} />

          <div style={{ fontWeight: 700, fontSize: 14 }}>Comments ({comments.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No comments yet. Start the conversation!</div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ padding: 8, background: 'var(--bg-elevated)', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{c.user?.display_name || 'Creator'}</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>{c.text}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              placeholder="Add your reply…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
            <button className="btn-primary" onClick={handleAdd} disabled={submitting || !text.trim()}>
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// AUTH VIEW
// -------------------------------------------------------------
function AuthView({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
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

  const handleDemo = async () => {
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
    <div className="auth-stage">
      <div className="auth-panel-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <div className="brand-shield-icon">
            <Shield size={22} />
          </div>
          <div className="brand-name" style={{ fontSize: 24 }}>SocialSentinel</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>
            {mode === 'login' ? 'Welcome Back' : 'Join SocialSentinel'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            AI-driven social network with hybrid recommendations and sentiment awareness.
          </p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input
              required
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
          )}

          <input
            required
            placeholder={mode === 'login' ? 'Email or Username' : 'Email Address'}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          {mode === 'register' && (
            <input
              placeholder="Display Name"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
          )}

          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          <button className="btn-primary" style={{ justifyContent: 'center', padding: 12, marginTop: 4 }} disabled={loading}>
            {loading ? 'Authenticating…' : mode === 'login' ? 'Log In' : 'Create Account'}
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
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick Assessment & Interview Review</span>
          <button
            onClick={handleDemo}
            className="btn-secondary"
            style={{ justifyContent: 'center', padding: 10, fontWeight: 700 }}
            disabled={loading}
          >
            🚀 Try Demo Account (Sentinel Explorer)
          </button>
        </div>
      </div>
    </div>
  );
}
