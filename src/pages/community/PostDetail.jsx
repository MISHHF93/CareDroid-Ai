import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPost,
  votePost,
  toggleSave,
  toggleAnnotate,
  addComment,
  voteComment,
  markAnswer,
  incrementViews,
  CATEGORIES,
} from '../../services/communityService';
import './Community.css';

const AVATAR_COLORS = [
  '#3B82F6','#22C55E','#EF4444','#F59E0B','#A78BFA',
  '#F472B6','#34D399','#FB923C','#60A5FA','#4ADE80',
];

function AvatarChip({ name, size = 18 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <span
      className="author-avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.5 }}
    >
      {initials}
    </span>
  );
}

/** Minimal inline markdown: **bold**, numbered lists, line breaks */
function RenderBody({ text }) {
  if (!text) return null;
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className="post-detail-body">
      {paragraphs.map((para, i) => {
        // Numbered list paragraph
        if (/^\d+\./.test(para.trim())) {
          const lines = para.split('\n').filter(Boolean);
          return (
            <ol key={i} style={{ paddingLeft: 20, margin: '6px 0' }}>
              {lines.map((line, j) => {
                const clean = line.replace(/^\d+\.\s*/, '');
                return <li key={j} style={{ marginBottom: 3 }}>{renderInline(clean)}</li>;
              })}
            </ol>
          );
        }
        // Bullet list
        if (/^[-•]/.test(para.trim())) {
          const lines = para.split('\n').filter(Boolean);
          return (
            <ul key={i} style={{ paddingLeft: 20, margin: '6px 0' }}>
              {lines.map((line, j) => {
                const clean = line.replace(/^[-•]\s*/, '');
                return <li key={j} style={{ marginBottom: 3 }}>{renderInline(clean)}</li>;
              })}
            </ul>
          );
        }
        return <p key={i} style={{ margin: '0 0 10px' }}>{renderInline(para)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    const p = getPost(postId);
    setPost(p ? { ...p } : null);
  }

  useEffect(() => {
    incrementViews(postId);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (!post) {
    return (
      <div className="community-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Post not found.</p>
        <button
          className="post-detail-back"
          onClick={() => navigate('/community')}
          style={{ marginTop: 8 }}
        >
          ← Back to Community
        </button>
      </div>
    );
  }

  const cat = CATEGORIES.find(c => c.id === post.category);
  const net = post.upvotes - post.downvotes;

  function handleVote(dir) { votePost(post.id, dir); reload(); }
  function handleSave() { toggleSave(post.id); reload(); }
  function handleAnnotate() { toggleAnnotate(post.id); reload(); }
  function handleVoteComment(cid, dir) { voteComment(post.id, cid, dir); reload(); }
  function handleMarkAnswer(cid) { markAnswer(post.id, cid); reload(); }

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    addComment(post.id, {
      body: commentText.trim(),
      author: { name: 'Dr. You', specialty: 'General', verified: true },
    });
    setCommentText('');
    reload();
    setSubmitting(false);
  }

  return (
    <div className="post-detail-page">
      <div className="post-detail-inner">
        {/* Main content column */}
        <main>
          <button className="post-detail-back" onClick={() => navigate('/community')}>
            ← Back to MedX Community
          </button>

          {/* Post card */}
          <div className="post-detail-card">
            {/* Category + metadata header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span className={`post-category-badge category-${post.category}`}>
                {cat ? `${cat.icon} ${cat.label}` : post.category}
              </span>
              {post.pinned && <span className="ai-badge">📌 Pinned</span>}
              {post.aiAnnotated && <span className="ai-badge">🤖 AI Corpus</span>}
            </div>

            <h1 className="post-detail-title">{post.title}</h1>

            {/* Author row */}
            <div className="post-author-chip" style={{ marginBottom: 14, gap: 6 }}>
              <AvatarChip name={post.author?.name} size={22} />
              <span style={{ fontWeight: 700, fontSize: 12 }}>{post.author?.name}</span>
              {post.author?.verified && <span className="verified-badge" title="Verified MD">✓</span>}
              {post.author?.specialty && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>· {post.author.specialty}</span>
              )}
              <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Body */}
            <RenderBody text={post.body} />

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="post-tags" style={{ marginTop: 12 }}>
                {post.tags.map(tag => (
                  <span key={tag} className="post-tag">#{tag}</span>
                ))}
              </div>
            )}

            {/* Actions bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {/* Vote */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  className={`vote-btn${post.userVote === 'up' ? ' active-up' : ''}`}
                  onClick={() => handleVote('up')}
                >▲</button>
                <span className="vote-score" style={{ fontSize: 14, minWidth: 28 }}>{net}</span>
                <button
                  className={`vote-btn${post.userVote === 'down' ? ' active-down' : ''}`}
                  onClick={() => handleVote('down')}
                >▼</button>
              </div>

              <span className="post-stat" style={{ fontSize: 12 }}>💬 {post.comments?.length ?? 0} replies</span>
              <span className="post-stat" style={{ fontSize: 12 }}>👁 {post.views ?? 0} views</span>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button
                  className={`post-action-btn${post.saved ? ' saved' : ''}`}
                  onClick={handleSave}
                >
                  {post.saved ? '🔖 Saved' : '🔖 Save'}
                </button>
                <button
                  className={`post-action-btn${post.aiAnnotated ? ' annotated' : ''}`}
                  onClick={handleAnnotate}
                  style={{ fontSize: 12 }}
                >
                  🤖 {post.aiAnnotated ? 'Remove from AI Corpus' : 'Add to AI Corpus'}
                </button>
              </div>
            </div>

            {/* AI annotation note */}
            {post.aiAnnotated && post.aiAnnotationNote && (
              <div className="ai-panel" style={{ marginTop: 14 }}>
                <p className="ai-panel-title">🤖 AI Training Annotation</p>
                <p className="ai-panel-body">{post.aiAnnotationNote}</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="comments-section">
            <div className="comments-title">
              Replies · {post.comments?.length ?? 0}
            </div>

            {(post.comments || []).map(c => (
              <div
                key={c.id}
                className={`comment-card${c.isAnswer ? ' is-answer' : ''}`}
              >
                {c.isAnswer && <span className="answer-badge">✅ Accepted Answer</span>}

                <div style={{ flexShrink: 0 }}>
                  <AvatarChip name={c.author?.name} size={26} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="post-author-chip" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{c.author?.name}</span>
                    {c.author?.verified && <span className="verified-badge">✓</span>}
                    {c.author?.specialty && (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>· {c.author.specialty}</span>
                    )}
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 'auto' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="comment-body-text">{c.body}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <button
                      className={`vote-btn${c.userVote === 'up' ? ' active-up' : ''}`}
                      style={{ width: 22, height: 22, fontSize: 11 }}
                      onClick={() => handleVoteComment(c.id, 'up')}
                    >▲</button>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {(c.upvotes || 0) - (c.downvotes || 0)}
                    </span>
                    <button
                      className={`vote-btn${c.userVote === 'down' ? ' active-down' : ''}`}
                      style={{ width: 22, height: 22, fontSize: 11 }}
                      onClick={() => handleVoteComment(c.id, 'down')}
                    >▼</button>

                    {!c.isAnswer && post.category === 'question' && (
                      <button
                        className="post-action-btn"
                        style={{ fontSize: 11, marginLeft: 4 }}
                        onClick={() => handleMarkAnswer(c.id)}
                        title="Mark as accepted answer"
                      >
                        ✅ Mark as Answer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add comment form */}
            <form onSubmit={handleSubmitComment}>
              <div style={{ marginTop: 8, marginBottom: 4, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Add a Reply
              </div>
              <div className="comment-input-row">
                <textarea
                  className="comment-textarea"
                  placeholder="Share your clinical insight, question, or correction…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={submitting || !commentText.trim()}
                >
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="community-sidebar">
          <div className="sidebar-widget">
            <p className="sidebar-widget-title">📋 Post Stats</p>
            {[
              { label: 'Score', value: net },
              { label: 'Upvotes', value: post.upvotes },
              { label: 'Views', value: post.views },
              { label: 'Replies', value: post.comments?.length ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-widget">
            <p className="sidebar-widget-title">🏷️ Tags</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(post.tags || []).map(tag => (
                <span key={tag} className="post-tag">#{tag}</span>
              ))}
            </div>
          </div>

          {post.aiAnnotated && (
            <div className="ai-panel">
              <p className="ai-panel-title">🤖 AI Corpus Status</p>
              <p className="ai-panel-body">
                This post has been flagged for inclusion in the CareDroid AI training dataset. Clinical patterns and terminology will be used to improve diagnostic suggestions.
              </p>
            </div>
          )}

          <div className="sidebar-widget">
            <p className="sidebar-widget-title">👤 About Author</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AvatarChip name={post.author?.name} size={32} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{post.author?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{post.author?.specialty}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Reputation</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{post.author?.reputation}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
