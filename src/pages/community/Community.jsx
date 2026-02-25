import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CATEGORIES,
  DEPARTMENTS,
  getPosts,
  votePost,
  toggleSave,
  createPost,
  getTrendingTags,
  getTopContributors,
} from '../../services/communityService';
import './Community.css';

const AVATAR_COLORS = [
  '#3B82F6','#22C55E','#EF4444','#F59E0B','#A78BFA',
  '#F472B6','#34D399','#FB923C','#60A5FA','#4ADE80',
];

function AvatarChip({ name, size = 18 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
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

function CategoryBadge({ category }) {
  const cat = CATEGORIES.find(c => c.id === category);
  return (
    <span className={`post-category-badge category-${category}`}>
      {cat ? `${cat.icon} ${cat.label}` : category}
    </span>
  );
}

function PostCard({ post, onVote, onSave, onClick }) {
  return (
    <article
      className={`post-card${post.pinned ? ' pinned' : ''}${post.hasAccepted ? ' accepted' : ''}`}
      onClick={() => onClick(post.id)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(post.id)}
    >
      {/* Vote column */}
      <div className="post-vote" onClick={e => e.stopPropagation()}>
        <button
          className={`vote-btn${post.userVote === 'up' ? ' active-up' : ''}`}
          onClick={() => onVote(post.id, 'up')}
          title="Upvote"
        >▲</button>
        <span className="vote-score">{post.upvotes - post.downvotes}</span>
        <button
          className={`vote-btn${post.userVote === 'down' ? ' active-down' : ''}`}
          onClick={() => onVote(post.id, 'down')}
          title="Downvote"
        >▼</button>
      </div>

      {/* Content */}
      <div className="post-body">
        <div className="post-meta-top">
          <CategoryBadge category={post.category} />
          {post.pinned && <span className="ai-badge">📌 Pinned</span>}
        </div>

        <h3 className="post-title">{post.title}</h3>
        <p className="post-preview">{post.preview}</p>

        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.slice(0, 4).map(tag => (
              <button
                key={tag}
                className="post-tag"
                onClick={e => e.stopPropagation()}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="post-footer">
          <div className="post-author-chip">
            <AvatarChip name={post.author?.name} />
            <span>{post.author?.name}</span>
            {post.author?.verified && <span className="verified-badge" title="Verified MD">✓</span>}
            {post.author?.specialty && (
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>· {post.author.specialty}</span>
            )}
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
              · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <span className="post-stat">💬 {post.commentCount ?? 0}</span>
          <span className="post-stat">👁 {post.views ?? 0}</span>

          <div className="post-actions" onClick={e => e.stopPropagation()}>
            <button
              className={`post-action-btn${post.saved ? ' saved' : ''}`}
              onClick={() => onSave(post.id)}
              title={post.saved ? 'Saved' : 'Save'}
            >
              {post.saved ? '🔖 Saved' : '🔖 Save'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Create Post Modal ─── */
function CreatePostModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('question');
  const [deptTags, setDeptTags] = useState([]);    // department IDs
  const [clinicalTags, setClinicalTags] = useState(''); // free clinical terms
  const [submitting, setSubmitting] = useState(false);

  const toggleDept = (id) =>
    setDeptTags(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    const clinical = clinicalTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    await onSubmit({ title: title.trim(), body: body.trim(), category, tags: [...deptTags, ...clinical] });
    setSubmitting(false);
    onClose();
  };

  // Group departments for the picker
  const groups = [...new Set(DEPARTMENTS.map(d => d.group))];

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">✏️ Post to MedX Community</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="modal-label">Category</label>
            <select
              className="modal-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="modal-label">Title</label>
            <input
              className="modal-input"
              placeholder="Clear, specific title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div>
            <label className="modal-label">Body</label>
            <textarea
              className="modal-textarea"
              placeholder="Describe case details, question, or discussion point. Be specific — include vitals, labs, timeline."
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
          </div>

          {/* Department hashtag picker */}
          <div>
            <label className="modal-label">
              Department Tags
              {deptTags.length > 0 && (
                <span className="modal-label-count">{deptTags.length} selected</span>
              )}
            </label>
            <div className="dept-picker">
              {groups.map(group => (
                <div key={group} className="dept-picker-group">
                  <p className="dept-picker-group-label">{group}</p>
                  <div className="dept-picker-chips">
                    {DEPARTMENTS.filter(d => d.group === group).map(dept => (
                      <button
                        key={dept.id}
                        type="button"
                        className={`dept-chip${deptTags.includes(dept.id) ? ' selected' : ''}`}
                        onClick={() => toggleDept(dept.id)}
                      >
                        {dept.icon} {dept.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional additional clinical terms */}
          <div>
            <label className="modal-label">Additional Clinical Terms <span className="modal-label-hint">(comma-separated, optional)</span></label>
            <input
              className="modal-input"
              placeholder="e.g. ARDS, ECMO, sepsis, SGLT2i"
              value={clinicalTags}
              onChange={e => setClinicalTags(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={submitting || !title.trim() || !body.trim()}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Community Page ─── */
export default function Community() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('hot');
  const [savedOnly, setSavedOnly] = useState(false);
  const [posts, setPosts] = useState([]);
  const [filterTag, setFilterTag] = useState('');
  const [trendingTags, setTrendingTags] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef(null);

  // Debounce search input
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 280);
  };

  const reload = useCallback(() => {
    const fetched = getPosts({ category, search: debouncedSearch, tag: filterTag, sort, savedOnly });
    setPosts(fetched);
    setTrendingTags(getTrendingTags(12));
    setTopContributors(getTopContributors(5));
  }, [category, debouncedSearch, filterTag, sort, savedOnly]);

  useEffect(() => { reload(); }, [reload]);

  function handleVote(id, dir) { votePost(id, dir); reload(); }
  function handleSave(id) { toggleSave(id); reload(); }

  function handleCreatePost(data) {
    createPost({
      ...data,
      author: {
        name: 'Dr. You',
        specialty: 'General',
        verified: true,
        reputation: 100,
      },
    });
    reload();
  }

  const SORT_OPTIONS = [
    { id: 'hot',  label: '🔥 Hot' },
    { id: 'new',  label: '🆕 New' },
    { id: 'top',  label: '⬆️ Top' },
  ];

  return (
    <div className="community-page">
      {/* Top bar */}
      <div className="community-topbar">
        <h1 className="community-title">
          <span>🩺</span> MedX
          <span className="community-title-sub">— Clinical Community</span>
        </h1>
        <input
          className="community-search"
          placeholder="Search cases, questions, protocols…"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
        />
        <button className="community-post-btn" onClick={() => setShowCreate(true)}>
          ✏️ New Post
        </button>
      </div>

      {/* Category Tabs */}
      <div className="community-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`community-tab${category === cat.id && !savedOnly ? ' active' : ''}`}
            onClick={() => { setCategory(cat.id); setFilterTag(''); setSavedOnly(false); }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
        <button
          className={`community-tab${savedOnly ? ' active' : ''}`}
          onClick={() => { setSavedOnly(s => !s); }}
          title="Saved posts"
        >
          🔖 Saved
        </button>
        {filterTag && (
          <button
            className="community-tab active"
            onClick={() => setFilterTag('')}
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid #3B82F6' }}
          >
            #{filterTag} ✕
          </button>
        )}
      </div>

      {/* Main layout */}
      <div className="community-inner">
        {/* Feed */}
        <section className="community-feed">
          {/* Sort + results bar */}
          <div className="feed-meta-bar">
            <span className="feed-results-count">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              {filterTag && <span className="feed-filter-tag"> · #{filterTag}</span>}
              {savedOnly && <span className="feed-filter-tag"> · saved</span>}
            </span>
            <div className="sort-tabs">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`sort-tab${sort === opt.id ? ' active' : ''}`}
                  onClick={() => setSort(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="feed-empty">
              <div className="feed-empty-icon">🩺</div>
              <p className="feed-empty-title">
                {savedOnly ? 'No saved posts yet' : debouncedSearch ? 'No results found' : 'No posts here yet'}
              </p>
              <p className="feed-empty-sub">
                {savedOnly
                  ? 'Save posts to read them later.'
                  : debouncedSearch
                  ? `Try different keywords or clear the search.`
                  : 'Be the first to post a case or question!'}
              </p>
              {!savedOnly && !debouncedSearch && (
                <button className="community-post-btn" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
                  ✏️ Write a Post
                </button>
              )}
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onVote={handleVote}
                onSave={handleSave}
                onClick={id => navigate(`/community/post/${id}`)}
              />
            ))
          )}
        </section>

        {/* Right sidebar */}
        <aside className="community-sidebar">
          {/* Departments browser */}
          <div className="sidebar-widget">
            <p className="sidebar-widget-title">🏥 Departments</p>
            {(() => {
              // Build count map from trendingTags (dept IDs are now in tags)
              const countMap = Object.fromEntries(trendingTags.map(t => [t.tag, t.count]));
              const groups = [...new Set(DEPARTMENTS.map(d => d.group))];
              return groups.map(group => (
                <div key={group} className="sidebar-dept-group">
                  <p className="sidebar-dept-group-label">{group}</p>
                  <div className="sidebar-dept-chips">
                    {DEPARTMENTS.filter(d => d.group === group).map(dept => {
                      const count = countMap[dept.id] || 0;
                      const active = filterTag === dept.id;
                      return (
                        <button
                          key={dept.id}
                          className={`sidebar-dept-chip${active ? ' active' : ''}${count > 0 ? ' has-posts' : ''}`}
                          onClick={() => { setFilterTag(active ? '' : dept.id); setSavedOnly(false); }}
                          title={`${dept.label}${count ? ` · ${count} post${count > 1 ? 's' : ''}` : ''}`}
                        >
                          {dept.icon} {dept.label}
                          {count > 0 && <span className="sidebar-dept-count">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Top contributors */}
          <div className="sidebar-widget">
            <p className="sidebar-widget-title">🏆 Top Contributors</p>
            {topContributors.map(user => (
              <div key={user.name} className="contributor-row">
                <AvatarChip name={user.name} size={28} />
                <div className="contributor-info">
                  <div className="contributor-name">{user.name}</div>
                  <div className="contributor-specialty">{user.specialty}</div>
                </div>
                <span className="contributor-rep">{user.reputation} rep</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
}
