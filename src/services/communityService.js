/**
 * communityService.js
 * Mock data layer for CareDroid Community (MedX)
 * Future: swap to REST/WebSocket backend + AI annotation pipeline
 */

const SPECIALTIES = [
  'Cardiology', 'Emergency', 'ICU/Critical Care', 'Internal Medicine',
  'Neurology', 'Oncology', 'Pediatrics', 'Surgery', 'Radiology',
  'Psychiatry', 'Anesthesiology', 'Infectious Disease', 'Nephrology',
  'Pulmonology', 'Endocrinology', 'Gastroenterology', 'Hematology',
  'Rheumatology', 'Dermatology', 'Orthopedics'
];

export const CATEGORIES = [
  { id: 'all',           label: 'All',           icon: '🌐' },
  { id: 'case',          label: 'Clinical Cases', icon: '🏥' },
  { id: 'question',      label: 'Questions',      icon: '❓' },
  { id: 'protocol',      label: 'Protocols',      icon: '📋' },
  { id: 'research',      label: 'Research',       icon: '🔬' },
  { id: 'announcement',  label: 'Announcements',  icon: '📢' },
  { id: 'discussion',    label: 'Discussion',     icon: '💬' },
];

/** Mock authors */
const AUTHORS = [
  { id: 'u1', name: 'Dr. Sarah Chen',       role: 'physician', specialty: 'Cardiology',         avatar: null, verified: true,  reputation: 1240 },
  { id: 'u2', name: 'Dr. Marcus Williams',  role: 'physician', specialty: 'Emergency',           avatar: null, verified: true,  reputation: 987  },
  { id: 'u3', name: 'Dr. Priya Patel',      role: 'physician', specialty: 'ICU/Critical Care',   avatar: null, verified: true,  reputation: 2103 },
  { id: 'u4', name: 'Nurse Jamie Torres',   role: 'nurse',     specialty: 'Oncology',            avatar: null, verified: false, reputation: 560  },
  { id: 'u5', name: 'Dr. Aiko Tanaka',      role: 'physician', specialty: 'Neurology',           avatar: null, verified: true,  reputation: 1750 },
  { id: 'u6', name: 'Dr. Liam O\'Brien',    role: 'physician', specialty: 'Surgery',             avatar: null, verified: true,  reputation: 830  },
  { id: 'u7', name: 'Dr. Fatima Al-Rashid', role: 'physician', specialty: 'Internal Medicine',   avatar: null, verified: true,  reputation: 1320 },
  { id: 'u8', name: 'Dr. Carlos Mendez',    role: 'physician', specialty: 'Pulmonology',         avatar: null, verified: true,  reputation: 690  },
  { id: 'u9', name: 'Dr. Emily Okafor',     role: 'physician', specialty: 'Infectious Disease',  avatar: null, verified: true,  reputation: 1890 },
];

/** Seed posts with rich clinical content */
const SEED_POSTS = [
  {
    id: 'p1',
    category: 'case',
    title: 'Unusual ARDS presentation post-cardiac surgery — refractory to prone positioning',
    body: `**Case Summary:**\n58M, post-CABG day 2. Developed bilateral infiltrates, PaO2/FiO2 ratio 82. Refractory to standard prone positioning after 16h. PEEP titration per ARDSnet failed to improve compliance.\n\n**Question:** Has anyone trialed VV-ECMO earlier in post-cardiac patients? What threshold PF ratio and compliance do you use for ECMO initiation in this context?\n\n**Key vitals:** pH 7.28, PaCO2 58, Driving pressure 18 cmH2O, Crs 22 mL/cmH2O`,
    tags: ['ARDS', 'ECMO', 'post-cardiac', 'ICU', 'ventilation'],
    author: AUTHORS[2],
    upvotes: 48,
    downvotes: 2,
    userVote: null,
    comments: [],
    views: 312,
    saved: false,
    aiAnnotated: true,
    aiAnnotationNote: 'Flagged for ARDS ventilation decision model training dataset v2.1',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    accepted: false,
    pinned: true,
  },
  {
    id: 'p2',
    category: 'question',
    title: 'Target MAP in septic shock with pre-existing hypertension — 65 vs 80 mmHg?',
    body: `PROSEVA and SEPSISPAM trials gave us some guidance but I still see major variation in our unit. For a patient with known Stage 3 HTN (baseline systolic 160s), do you adjust the MAP target upward? \n\nOur ID attending insists on 80+ for neuroprotection. Our intensivist argues the NE dose to achieve that causes more harm. Would love data or institutional protocols from this community.`,
    tags: ['sepsis', 'shock', 'MAP', 'vasopressors', 'ICU'],
    author: AUTHORS[6],
    upvotes: 61,
    downvotes: 3,
    userVote: null,
    comments: [],
    views: 445,
    saved: false,
    aiAnnotated: false,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    accepted: false,
    pinned: false,
  },
  {
    id: 'p3',
    category: 'protocol',
    title: 'Shared: Rapid RASS-based sedation weaning protocol for mechanically ventilated patients',
    body: `We implemented this at our centre 6 months ago and reduced mean ventilator days by 1.4. Sharing for community feedback.\n\n**Protocol Steps:**\n1. Daily SAT + SBT bundle at 06:00\n2. RASS target -1 to 0 after post-op day 1\n3. Propofol taper 20 mcg/kg/min Q2H if RASS ≥ 0 for 2 consecutive assessments\n4. Dexmedetomidine bridge for agitation during wean\n5. Mandatory delirium screen (CAM-ICU) Q8H\n\nHappy to share the full protocol PDF — DM me.`,
    tags: ['sedation', 'ventilator-weaning', 'delirium', 'RASS', 'protocol', 'ICU'],
    author: AUTHORS[2],
    upvotes: 93,
    downvotes: 1,
    userVote: null,
    comments: [],
    views: 728,
    saved: true,
    aiAnnotated: true,
    aiAnnotationNote: 'Included in sedation protocol corpus for CareDroid AI protocol suggestion engine',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    accepted: false,
    pinned: false,
  },
  {
    id: 'p4',
    category: 'research',
    title: 'New meta-analysis: SGLT2i mortality benefit extends to non-diabetic HFrEF — implications for prescribing',
    body: `Just published in NEJM Evidence. Pooled analysis of DAPA-HF and EMPEROR-Reduced with subgroup stratification. Key finding: NNT for all-cause mortality in non-DM HFrEF = 34 (95% CI 22–61) over 24 months.\n\nThis changes our institution's heart failure protocol. We're now initiating empagliflozin for all EF <40% regardless of glycaemic status.\n\nDiscussion on eGFR thresholds, drug interactions with loop diuretics, and titration schedules welcome.`,
    tags: ['SGLT2i', 'heart-failure', 'HFrEF', 'cardiology', 'meta-analysis', 'NEJM'],
    author: AUTHORS[0],
    upvotes: 134,
    downvotes: 4,
    userVote: null,
    comments: [],
    views: 1102,
    saved: false,
    aiAnnotated: true,
    aiAnnotationNote: 'Heart failure treatment guideline corpus — CareDroid CDS v3',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    accepted: false,
    pinned: false,
  },
  {
    id: 'p5',
    category: 'case',
    title: 'Paediatric DKA — refractory hypokalemia despite aggressive replacement, unusual cause found',
    body: `14F, type 1 DM. DKA on presentation (glucose 41 mmol/L, pH 7.09, K+ 2.8 on admission after hydration). Replaced 200 mEq K+ over 12h — K+ remained 2.6.\n\n**Twist:** Concurrent hypomagnesaemia (Mg2+ 0.42 mmol/L) not initially recognised. Mg replacement corrected the refractory hypokalaemia within 6h.\n\n**Lesson:** Always check Mg in DKA with refractory hypokalaemia. Mag competes for same renal tubular exchanger.`,
    tags: ['DKA', 'paediatrics', 'hypokalemia', 'hypomagnesaemia', 'electrolytes'],
    author: AUTHORS[3],
    upvotes: 79,
    downvotes: 0,
    userVote: null,
    comments: [],
    views: 567,
    saved: false,
    aiAnnotated: false,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    accepted: true,
    pinned: false,
  },
  {
    id: 'p6',
    category: 'discussion',
    title: 'AI-assisted diagnosis: where do you draw the line on LLM recommendations at the bedside?',
    body: `With tools like CareDroid's Diagnosis Assistant, I find myself using AI suggestions as a differential-generator, but I'm seeing junior colleagues take outputs as near-definitive. \n\nWhere do your institutions stand on AI-assisted diagnosis liability? Have you formalised any governance or informed consent frameworks?\n\nWould love to hear from both community hospitals and academic centres.`,
    tags: ['AI', 'clinical-ai', 'governance', 'medtech', 'diagnosis'],
    author: AUTHORS[4],
    upvotes: 112,
    downvotes: 8,
    userVote: null,
    comments: [],
    views: 892,
    saved: false,
    aiAnnotated: false,
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    accepted: false,
    pinned: false,
  },
  {
    id: 'p7',
    category: 'announcement',
    title: '📢 CareDroid Community Launch — Welcome to MedX!',
    body: `We're excited to launch **CareDroid Community (MedX)** — a professional network built for clinicians, by clinicians.\n\n**What you can do here:**\n- Share and discuss clinical cases (anonymised)\n- Ask clinical questions and get peer-reviewed answers\n- Share and download protocols\n- Discuss research findings\n- Contribute to CareDroid's AI training through voluntary data annotation\n\n**Ground rules:**\n1. Patient data must be fully anonymised\n2. Be collegial — debate ideas, not people\n3. Cite sources when making clinical claims\n4. Flag AI annotation contributions with the 🤖 annotation tool\n\nWelcome aboard. Let's raise the standard of clinical care together.`,
    tags: ['announcement', 'community', 'CareDroid', 'MedX'],
    author: { id: 'system', name: 'CareDroid Team', role: 'admin', specialty: 'Platform', verified: true, reputation: 0 },
    upvotes: 205,
    downvotes: 0,
    userVote: null,
    comments: [],
    views: 1840,
    saved: false,
    aiAnnotated: false,
    createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    accepted: false,
    pinned: true,
  },
  {
    id: 'p8',
    category: 'question',
    title: 'Best fluid resuscitation strategy for burn patients > 40% TBSA — Parkland still the standard?',
    body: `Dealing with a 32M, 45% TBSA burns, mixed partial/full thickness. Our burn unit still uses modified Parkland (4 mL/kg/% TBSA), but I've read centres moving to Brooke formula or albumin-supplemented protocols.\n\nEvidence seems to favour anything that limits oedema and avoids fluid creep. What's your unit using in 2026?`,
    tags: ['burns', 'resuscitation', 'Parkland', 'fluid-therapy', 'surgery'],
    author: AUTHORS[5],
    upvotes: 34,
    downvotes: 1,
    userVote: null,
    comments: [],
    views: 289,
    saved: false,
    aiAnnotated: false,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    accepted: false,
    pinned: false,
  },
  {
    id: 'p9',
    category: 'case',
    title: 'Bilateral pulmonary infiltrates on CXR — all cultures negative, steroids not helping, what am I missing?',
    body: `48F, never smoker, no known CTD. Progressive dyspnoea x 3 weeks. CXR bilateral infiltrates. HRCT: crazy-paving pattern. BAL: negative bacterial, viral, fungal. ANA 1:160 speckled. No rash, no arthritis, PFTs show restrictive pattern, DLCO 48%.\n\nStarted on 1mg/kg prednisolone — minimal improvement at 3 weeks. Considering cyclophosphamide or MMF but not sure of diagnosis.\n\nDifferential includes COP, NSIP, DIP, HP — open to thoughts.`,
    tags: ['ILD', 'diffuse-lung-disease', 'HRCT', 'crazy-paving', 'autoimmune'],
    author: AUTHORS[7],
    upvotes: 57,
    downvotes: 0,
    userVote: null,
    comments: [],
    views: 421,
    saved: false,
    aiAnnotated: true,
    aiAnnotationNote: 'ILD differential diagnosis corpus — respiratory medicine AI module',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    accepted: false,
    pinned: false,
  },
  {
    id: 'p10',
    category: 'research',
    title: 'Lancet ID: bedaquiline + pretomanid combo halving XDR-TB treatment duration — experience from SA trial',
    body: `Colleagues treating XDR-TB should read the new Lancet ID paper. BPaL regimen (bedaquiline + pretomanid + linezolid) achieving 90% culture conversion at 6 months vs historical 26% at 24 months.\n\nKey safety concern: linezolid myelosuppression dose-dependence. SA group using 600mg daily (vs 1200mg) with equivalent efficacy and far less toxicity.\n\nImplications for our TB protocols? Happy to share our updated dosing schedule.`,
    tags: ['TB', 'XDR-TB', 'bedaquiline', 'pretomanid', 'Lancet', 'infectious-disease'],
    author: AUTHORS[8],
    upvotes: 88,
    downvotes: 2,
    userVote: null,
    comments: [],
    views: 634,
    saved: false,
    aiAnnotated: false,
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    accepted: false,
    pinned: false,
  },
];

/** Seed comments for each post */
const SEED_COMMENTS = {
  p1: [
    { id: 'c1', postId: 'p1', author: AUTHORS[1], body: 'We initiate VV-ECMO at PF ratio <80 with driving pressure >18 AND compliance <25 in post-cardiac patients. The cardiac surgery team stays involved for canulation decisions. Have used it 3 times this year with good decanulation outcomes at 7-14 days.', upvotes: 22, userVote: null, createdAt: new Date(Date.now() - 90 * 60000).toISOString(), isAnswer: true },
    { id: 'c2', postId: 'p1', author: AUTHORS[4], body: 'Agree with the above. Also worth considering inhaled epoprostenol as a bridge while ECMO is being set up — can buy you 2-4 hours and sometimes avoid ECMO altogether. We\'ve had 2 cases where targeted iNO plus epoprostenol resolved within 48h.', upvotes: 15, userVote: null, createdAt: new Date(Date.now() - 60 * 60000).toISOString(), isAnswer: false },
    { id: 'c3', postId: 'p1', author: AUTHORS[2], body: 'Thank you both. We did try iNO — 20ppm for 12h with minimal response (PaO2 +18 mmHg). Will discuss ECMO initiation with our cardiac surgery team tomorrow morning.', upvotes: 8, userVote: null, createdAt: new Date(Date.now() - 30 * 60000).toISOString(), isAnswer: false },
  ],
  p2: [
    { id: 'c4', postId: 'p2', author: AUTHORS[2], body: 'SEPSISPAM is the definitive trial here. For stage 3 HTN, we target MAP 75-80 in the first 6h then reassess. Above that we see significantly more AF on our unit which compounds the problem. NE dose ceiling also matters — we switch to vasopressin when NE > 0.25 mcg/kg/min.', upvotes: 31, userVote: null, createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), isAnswer: true },
    { id: 'c5', postId: 'p2', author: AUTHORS[5], body: 'We had a similar debate. Our compromise was MAP 70 default, titrate to 75 if evidence of end-organ dysfunction (rising creatinine, lactate plateau). Avoids aggressive NE doses while still providing some extra perfusion pressure.', upvotes: 18, userVote: null, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), isAnswer: false },
  ],
  p3: [],
  p4: [
    { id: 'c6', postId: 'p4', author: AUTHORS[6], body: 'We implemented this 4 months ago. One note: in patients on high-dose furosemide, we\'ve seen diuretic synergy causing symptomatic hypotension in the first 2 weeks. We now start at half the furosemide dose when initiating empagliflozin in outpatient HF.', upvotes: 42, userVote: null, createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), isAnswer: false },
  ],
  p5: [],
  p6: [
    { id: 'c7', postId: 'p6', author: AUTHORS[8], body: 'Our institution has a draft AI Clinical Decision Support policy that requires any AI recommendation to be countersigned by the attending before being acted upon. Still being ratified. The liability question is genuinely unresolved in most jurisdictions.', upvotes: 27, userVote: null, createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), isAnswer: false },
    { id: 'c8', postId: 'p6', author: AUTHORS[0], body: 'I use AI DDx as a checklist, not an answer. The framing matters enormously for trainees. We brief our residents: "treat the AI like a smart medical student — review everything it says before acting." That reframe has worked well.', upvotes: 38, userVote: null, createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), isAnswer: false },
  ],
  p7: [],
  p8: [
    { id: 'c9', postId: 'p8', author: AUTHORS[5], body: 'Modified Brooke (2 mL/kg/%) with 5% albumin supplementation after 8h. We\'ve seen mean 24h fluid volume drop 22% vs historical Parkland controls. No significant difference in renal outcomes at 72h.', upvotes: 19, userVote: null, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), isAnswer: true },
  ],
  p9: [
    { id: 'c10', postId: 'p9', author: AUTHORS[8], body: 'The crazy-paving on HRCT with ANA positivity + lack of steroid response strongly suggests NSIP over COP. I\'d push for a surgical lung biopsy if not done. Also repeat BAL for PCP — can be missed on first pass. MMF is a reasonable empirical add at this point.', upvotes: 29, userVote: null, createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), isAnswer: true },
  ],
  p10: [
    { id: 'c11', postId: 'p10', author: AUTHORS[3], body: 'Our centre adopted BPaL with 600mg linezolid 3 months ago. CBC weekly in months 1-3 then monthly. We\'ve had 2 cases of grade 2 anaemia managed with dose reduction to 300mg. No grade 3/4 toxicity yet in 11 patients.', upvotes: 24, userVote: null, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), isAnswer: false },
  ],
};

// Add comments to posts
const POSTS = SEED_POSTS.map(p => ({
  ...p,
  comments: (SEED_COMMENTS[p.id] || []),
}));

/** In-memory mutable store (simulates backend) */
let store = {
  posts: JSON.parse(JSON.stringify(POSTS)), // deep clone
  nextId: 100,
};

/** Reset store to seed data (for dev) */
export const resetStore = () => {
  store = { posts: JSON.parse(JSON.stringify(POSTS)), nextId: 100 };
};

/** Get all posts, optionally filtered */
export const getPosts = ({ category = 'all', search = '', tag = '', sort = 'hot', savedOnly = false } = {}) => {
  let result = store.posts;
  if (savedOnly) result = result.filter(p => p.saved);
  if (category !== 'all') result = result.filter(p => p.category === category);
  if (tag) result = result.filter(p => p.tags.includes(tag));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  return [...result].sort((a, b) => {
    // Pinned always first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sort === 'new') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'top') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    // 'hot' — score weighted by recency (Wilson-style approximation)
    const score = p => {
      const net = p.upvotes - p.downvotes;
      const ageHours = (Date.now() - new Date(p.createdAt)) / 36e5;
      return net / Math.pow(ageHours + 2, 1.5);
    };
    return score(b) - score(a);
  });
};

/** Get single post by id */
export const getPost = (id) => store.posts.find(p => p.id === id) || null;

/** Create new post */
export const createPost = ({ title, body, category, tags, author }) => {
  const post = {
    id: `p${++store.nextId}`,
    title,
    body,
    category,
    tags: tags || [],
    author,
    upvotes: 0,
    downvotes: 0,
    userVote: null,
    comments: [],
    views: 0,
    saved: false,
    aiAnnotated: false,
    createdAt: new Date().toISOString(),
    accepted: false,
    pinned: false,
  };
  store.posts.unshift(post);
  return post;
};

/** Vote on a post */
export const votePost = (postId, vote) => {
  const post = store.posts.find(p => p.id === postId);
  if (!post) return;
  if (post.userVote === vote) {
    // undo vote
    if (vote === 'up') post.upvotes--;
    else post.downvotes--;
    post.userVote = null;
  } else {
    if (post.userVote === 'up') post.upvotes--;
    if (post.userVote === 'down') post.downvotes--;
    if (vote === 'up') post.upvotes++;
    else post.downvotes++;
    post.userVote = vote;
  }
};

/** Add comment */
export const addComment = (postId, { body, author }) => {
  const post = store.posts.find(p => p.id === postId);
  if (!post) return null;
  const comment = {
    id: `c${++store.nextId}`,
    postId,
    body,
    author,
    upvotes: 0,
    userVote: null,
    createdAt: new Date().toISOString(),
    isAnswer: false,
  };
  post.comments.push(comment);
  return comment;
};

/** Vote on comment */
export const voteComment = (postId, commentId, vote) => {
  const post = store.posts.find(p => p.id === postId);
  if (!post) return;
  const comment = post.comments.find(c => c.id === commentId);
  if (!comment) return;
  if (comment.userVote === vote) {
    comment.upvotes--;
    comment.userVote = null;
  } else {
    if (comment.userVote === 'up') comment.upvotes--;
    comment.upvotes += vote === 'up' ? 1 : 0;
    comment.userVote = vote;
  }
};

/** Toggle save */
export const toggleSave = (postId) => {
  const post = store.posts.find(p => p.id === postId);
  if (post) post.saved = !post.saved;
};

/** Toggle AI annotation */
export const toggleAnnotate = (postId, note = '') => {
  const post = store.posts.find(p => p.id === postId);
  if (!post) return;
  post.aiAnnotated = !post.aiAnnotated;
  if (post.aiAnnotated) post.aiAnnotationNote = note || 'Flagged for CareDroid AI training corpus';
  else post.aiAnnotationNote = '';
};

/** Mark comment as answer */
export const markAnswer = (postId, commentId) => {
  const post = store.posts.find(p => p.id === postId);
  if (!post) return;
  post.comments.forEach(c => { c.isAnswer = c.id === commentId ? !c.isAnswer : false; });
  post.accepted = post.comments.some(c => c.isAnswer);
};

/** Increment view count */
export const incrementViews = (postId) => {
  const post = store.posts.find(p => p.id === postId);
  if (post) post.views++;
};

/** Trending tags across all posts */
export const getTrendingTags = (limit = 12) => {
  const freq = {};
  store.posts.forEach(p => p.tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
};

/** Top contributors by reputation */
export const getTopContributors = (limit = 5) => {
  const seen = {};
  store.posts.forEach(p => {
    const a = p.author;
    if (!seen[a.id]) seen[a.id] = { ...a, posts: 0, totalVotes: 0 };
    seen[a.id].posts++;
    seen[a.id].totalVotes += p.upvotes;
  });
  return Object.values(seen)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, limit);
};

export const SPECIALTIES_LIST = SPECIALTIES;

/**
 * ─── AI Training Data Pipeline ───────────────────────────────────────────────
 * The CareDroid community generates high-quality clinical Q&A from verified
 * physicians. This data is the annotation corpus for CareDroid AI — useable
 * in Scale AI, Argilla, Label Studio, or any RLHF/SFT fine-tuning pipeline.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Aggregate KPIs for the AI training dataset */
export const getDatasetStats = () => {
  const all = store.posts;
  const annotated    = all.filter(p => p.aiAnnotated);
  const answered     = all.filter(p => p.accepted);
  const verifiedAuth = all.filter(p => p.author.verified);
  const totalViews   = all.reduce((s, p) => s + p.views, 0);
  const totalVotes   = all.reduce((s, p) => s + p.upvotes, 0);
  const totalComments = all.reduce((s, p) => s + p.comments.length, 0);

  // Exportable = annotated OR has an accepted answer
  const exportable = all.filter(p =>
    p.aiAnnotated || p.accepted
  );

  // Verified-answer count
  const verifiedAnswers = all.filter(p =>
    p.comments.some(c => c.isAnswer && c.author.verified)
  ).length;

  return {
    total:          all.length,
    annotated:      annotated.length,
    answered:       answered.length,
    answeredPct:    all.length ? Math.round((answered.length / all.length) * 100) : 0,
    verifiedPosts:  verifiedAuth.length,
    verifiedPct:    all.length ? Math.round((verifiedAuth.length / all.length) * 100) : 0,
    verifiedAnswers,
    totalViews,
    totalVotes,
    totalComments,
    exportable:     exportable.length,
  };
};

/**
 * Export community data as Scale AI / RLHF / SFT-compatible records.
 * Each record = { prompt, completion, metadata } — ready for fine-tuning
 * or human review in annotation studios.
 * Only posts that have at least one response are exported (need prompt+completion pairs).
 */
export const exportDataset = () => {
  const records = [];

  store.posts.forEach(post => {
    const net            = post.upvotes - post.downvotes;
    const acceptedCmt    = post.comments.find(c => c.isAnswer);
    const topCmt         = [...post.comments].sort((a, b) => b.upvotes - a.upvotes)[0];
    const bestAnswer     = acceptedCmt || topCmt;
    if (!bestAnswer) return; // skip unanswered — no completion pair yet

    // Engagement-weighted quality score [0–1]
    const qualityScore = Math.min(
      1,
      (net * 2 + post.views / 50 + (bestAnswer.upvotes || 0)) / 200
    );

    records.push({
      id:         post.id,
      source:     'caredroid-community',
      version:    '1.0',
      category:   post.category,
      tags:       post.tags,
      prompt:     `${post.title}\n\n${post.body}`,
      completion: bestAnswer.body,
      metadata: {
        author:                    post.author.name,
        author_specialty:          post.author.specialty,
        author_verified:           post.author.verified,
        answer_author:             bestAnswer.author?.name   ?? null,
        answer_author_specialty:   bestAnswer.author?.specialty ?? null,
        answer_author_verified:    bestAnswer.author?.verified  ?? false,
        answer_is_accepted:        !!acceptedCmt,
        net_votes:                 net,
        views:                     post.views,
        comment_count:             post.comments.length,
        quality_score:             +qualityScore.toFixed(3),
        ai_annotated:              post.aiAnnotated,
        annotation_note:           post.aiAnnotationNote ?? null,
        created_at:                post.createdAt,
      },
    });
  });

  // Highest quality first
  records.sort((a, b) => b.metadata.quality_score - a.metadata.quality_score);
  return records;
};

/** Trigger a JSONL download of the training dataset in the browser */
export const downloadDatasetJSONL = () => {
  const records = exportDataset();
  const jsonl   = records.map(r => JSON.stringify(r)).join('\n');
  const blob    = new Blob([jsonl], { type: 'application/jsonl' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `caredroid-dataset-${new Date().toISOString().slice(0, 10)}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
};
