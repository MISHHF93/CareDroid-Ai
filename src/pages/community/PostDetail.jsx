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
          onClick={() => navigate(-1)}
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
      {/* Mobile-safe top nav */}
      <div className="post-detail-topbar">
        <button className="post-detail-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <span className={`post-category-badge category-${post.category}`}>
          {cat ? `${cat.icon} ${cat.label}` : post.category}
        </span>
      </div>

      <div className="post-detail-inner">
        {/* Main content column */}
        <main>
          {/* Post card */}
          <div className="post-detail-card">
            {/* Category + metadata header */}
            <div className="post-detail-meta-top">
              <span className={`post-category-badge category-${post.category}`}>
                {cat ? `${cat.icon} ${cat.label}` : post.category}
              </span>
              {post.pinned && <span className="ai-badge">📌 Pinned</span>}
              {post.aiAnnotated && <span className="ai-badge">🤖 AI Corpus</span>}
            </div>

            <h1 className="post-detail-title">{post.title}</h1>

            {/* Author row */}
            <div className="post-author-chip post-detail-author">
              <AvatarChip name={post.author?.name} size={22} />
              <span className="post-detail-author-name">{post.author?.name}</span>
              {post.author?.verified && <span className="verified-badge" title="Verified MD">✓</span>}
              {post.author?.specialty && (
                <span className="post-detail-author-meta">· {post.author.specialty}</span>
              )}
              <span className="post-detail-author-meta">
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
            <div className="post-detail-actions">
              <div className="post-detail-vote">
                <button
                  className={`vote-btn${post.userVote === 'up' ? ' active-up' : ''}`}
                  onClick={() => handleVote('up')}
                >▲</button>
                <span className="vote-score">{net}</span>
                <button
                  className={`vote-btn${post.userVote === 'down' ? ' active-down' : ''}`}
                  onClick={() => handleVote('down')}
                >▼</button>
              </div>
              <span className="post-stat">💬 {post.comments?.length ?? 0} replies</span>
              <span className="post-stat">👁 {post.views ?? 0} views</span>
              <div className="post-actions">
                <button
                  className={`post-action-btn${post.saved ? ' saved' : ''}`}
                  onClick={handleSave}
                >
                  {post.saved ? '🔖 Saved' : '🔖 Save'}
                </button>
                <button
                  className={`post-action-btn${post.aiAnnotated ? ' annotated' : ''}`}
                  onClick={handleAnnotate}
                >
                  🤖 {post.aiAnnotated ? 'Remove from AI' : 'Add to AI'}
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
                <div className="comment-body">
                  <div className="post-author-chip comment-author-chip">
                    <span className="post-detail-author-name">{c.author?.name}</span>
                    {c.author?.verified && <span className="verified-badge">✓</span>}
                    {c.author?.specialty && (
                      <span className="post-detail-author-meta">· {c.author.specialty}</span>
                    )}
                    <span className="comment-date">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="comment-body-text">{c.body}</div>
                  <div className="comment-vote-row">
                    <button
                      className={`vote-btn${c.userVote === 'up' ? ' active-up' : ''}`}
                      onClick={() => handleVoteComment(c.id, 'up')}
                    >▲</button>
                    <span className="vote-score" style={{ fontSize: 11 }}>
                      {(c.upvotes || 0) - (c.downvotes || 0)}
                    </span>
                    <button
                      className={`vote-btn${c.userVote === 'down' ? ' active-down' : ''}`}
                      onClick={() => handleVoteComment(c.id, 'down')}
                    >▼</button>
                    {!c.isAnswer && post.category === 'question' && (
                      <button
                        className="post-action-btn"
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
              <p className="comments-reply-label">Add a Reply</p>
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
              <div className="sidebar-stats-row">
                {[
                  { label: 'Score', value: net },
                  { label: 'Views', value: post.views },
                  { label: 'Replies', value: post.comments?.length ?? 0 },
                ].map(s => (
                  <div key={s.label} className="sidebar-stat">
                    <div className="sidebar-stat-value">{s.value}</div>
                    <div className="sidebar-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-widget">
              <p className="sidebar-widget-title">🏷️ Tags</p>
              <div className="post-tags">
                {(post.tags || []).map(tag => (
                  <span key={tag} className="post-tag">#{tag}</span>
                ))}
              </div>
            </div>

            {post.aiAnnotated && (
              <div className="ai-panel">
                <p className="ai-panel-title">🤖 AI Corpus Status</p>
                <p className="ai-panel-body">
                  This post is flagged for inclusion in CareDroid AI training. Clinical patterns will improve diagnostic suggestions.
                </p>
              </div>
            )}

            <div className="sidebar-widget">
              <p className="sidebar-widget-title">👤 Author</p>
              <div className="contributor-row" style={{ paddingTop: 0 }}>
                <AvatarChip name={post.author?.name} size={30} />
                <div className="contributor-info">
                  <div className="contributor-name">{post.author?.name}</div>
                  <div className="contributor-specialty">{post.author?.specialty}</div>
                </div>
              </div>
              <div className="sidebar-stats-row" style={{ marginTop: 8 }}>
                <div className="sidebar-stat">
                  <div className="sidebar-stat-value">{post.author?.reputation}</div>
                  <div className="sidebar-stat-label">Rep</div>
                </div>
                <div className="sidebar-stat">
                  <div className="sidebar-stat-value">{post.upvotes}</div>
                  <div className="sidebar-stat-label">Votes</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
