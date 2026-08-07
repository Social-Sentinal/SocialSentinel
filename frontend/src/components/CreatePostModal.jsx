import React, { useState } from 'react';
import { X, Sparkles, Image, Tag, Send } from 'lucide-react';
import { createNewPost, predictSentimentText } from '../services/api';

export default function CreatePostModal({ onClose, onPostCreated }) {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [topicCategory, setTopicCategory] = useState('Career');
  const [hashtags, setHashtags] = useState('#motivation #growth');
  const [predictedSentiment, setPredictedSentiment] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePredict = async () => {
    if (!caption.trim()) return;
    setIsPredicting(true);
    try {
      const res = await predictSentimentText(caption);
      if (res && res.sentiment) {
        setPredictedSentiment(res);
      }
    } catch (err) {
      console.error('Failed to predict sentiment:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() || isPublishing) return;

    setIsPublishing(true);
    try {
      const res = await createNewPost({
        caption: caption.trim(),
        image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        topic_category: topicCategory,
        hashtags: hashtags.trim(),
        username: 'social_explorer',
        full_name: 'Social Explorer',
      });

      if (res.status === 'success' && res.data) {
        onPostCreated && onPostCreated(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to publish post:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 250,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="insta-card" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#EC4899" /> Create New Social Post
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Caption & Content
            </label>
            <textarea
              rows={4}
              placeholder="What's on your mind? Write your story..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-field"
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Topic Category
              </label>
              <select
                value={topicCategory}
                onChange={(e) => setTopicCategory(e.target.value)}
                className="input-field"
              >
                <option value="Career">Career & Growth</option>
                <option value="Relationships">Relationships & Healing</option>
                <option value="Technology">Technology & AI</option>
                <option value="Travel">Travel & Adventure</option>
                <option value="Fitness">Fitness & Health</option>
                <option value="Personal Growth">Personal Growth</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Hashtags
              </label>
              <input
                type="text"
                placeholder="#career #motivation"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Instant AI Sentiment Prediction Preview */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI Sentiment Analysis Preview:</span>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {predictedSentiment ? `${predictedSentiment.sentiment} (${Math.round(predictedSentiment.confidence * 100)}%)` : 'Not analyzed yet'}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePredict}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              disabled={isPredicting || !caption.trim()}
            >
              <Sparkles size={14} />
              {isPredicting ? 'Analyzing...' : 'Check Sentiment'}
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isPublishing}>
              <Send size={16} />
              {isPublishing ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
