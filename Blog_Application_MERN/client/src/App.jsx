import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import { BookOpen, Feather, Search, Plus, LogIn, LogOut, UserRound, X, ImagePlus, Edit3, Trash2, ArrowUpRight, Clock3, Sparkles } from 'lucide-react';

const API = 'http://localhost:5000/api';
const api = axios.create({ baseURL: API });
const imageUrl = path => path ? `http://localhost:5000${path}` : '';
const plainText = html => (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const excerpt = html => { const text = plainText(html); return text.length > 150 ? `${text.slice(0, 150)}…` : text; };
const dateLabel = date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('inkspace_token') || '');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('inkspace_user') || 'null'); } catch { return null; } });
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState('');
  const [editing, setEditing] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [postForm, setPostForm] = useState({ title: '', content: '' });
  const [cover, setCover] = useState(null);
  const fileRef = useRef(null);
  const quillRef = useRef(null);

  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  async function loadPosts(search = query) {
    try {
      const res = await api.get('/posts', { params: { q: search } });
      setPosts(res.data.posts || []);
    } catch { setNotice('Could not load posts. Make sure the backend and MongoDB are running.'); }
  }

  useEffect(() => { loadPosts(''); }, []);
  useEffect(() => { const timer = setTimeout(() => loadPosts(query), 250); return () => clearTimeout(timer); }, [query]);

  function showNotice(message) { setNotice(message); window.setTimeout(() => setNotice(''), 4000); }
  function logout() {
    localStorage.removeItem('inkspace_token'); localStorage.removeItem('inkspace_user');
    setToken(''); setUser(null); showNotice('You have been logged out.');
  }
  function openCreate() {
    if (!token) { setAuthMode('login'); setModal('auth'); showNotice('Log in first to publish your story.'); return; }
    setEditing(null); setPostForm({ title: '', content: '' }); setCover(null); setModal('post');
  }
  function openEdit(post) {
    setEditing(post); setPostForm({ title: post.title, content: post.content }); setCover(null); setModal('post');
  }
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, authForm);
      localStorage.setItem('inkspace_token', data.token);
      localStorage.setItem('inkspace_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setModal(''); setAuthForm({ name: '', email: '', password: '' });
      showNotice(authMode === 'login' ? 'Welcome back!' : 'Your account is ready. Welcome to InkSpace!');
    } catch (err) { showNotice(err.response?.data?.message || 'Could not authenticate. Please try again.'); }
    finally { setBusy(false); }
  }
  async function submitPost(e) {
    e.preventDefault();
    if (plainText(postForm.content).length < 5) return showNotice('Please add a little more content to your post.');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('title', postForm.title); form.append('content', postForm.content);
      if (cover) form.append('coverImage', cover);
      if (editing) await api.put(`/posts/${editing.id}`, form, { headers });
      else await api.post('/posts', form, { headers });
      setModal(''); setEditing(null); setCover(null); setPostForm({ title: '', content: '' });
      await loadPosts(); showNotice(editing ? 'Your story has been updated.' : 'Your story is live!');
    } catch (err) { showNotice(err.response?.data?.message || 'Could not save the post.'); }
    finally { setBusy(false); }
  }
  async function deletePost(post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    try { await api.delete(`/posts/${post.id}`, { headers }); await loadPosts(); showNotice('Post deleted.'); }
    catch (err) { showNotice(err.response?.data?.message || 'Could not delete the post.'); }
  }

  const featured = posts[0];
  const remaining = posts.slice(1);
  const modules = { toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'blockquote'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] };

  return <div className="app-shell">
    <div className="orb orb-one" /><div className="orb orb-two" />
    <header className="topbar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <span className="brand-mark"><Feather size={21} /></span><span>ink<span className="brand-light">space</span><small>STORIES THAT STAY</small></span>
      </a>
      <div className="nav-actions">
        <button className="nav-link" onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })}>Explore stories</button>
        {user ? <div className="user-chip"><span className="avatar"><UserRound size={15} /></span><span className="user-name">{user.name}</span><button className="icon-button" title="Log out" onClick={logout}><LogOut size={16} /></button></div> :
          <button className="btn btn-outline" onClick={() => { setAuthMode('login'); setModal('auth'); }}><LogIn size={16} /> Sign in</button>}
        <button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> Write a story</button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR IDEAS DESERVE A HOME</div>
          <h1>Every story starts<br />with <span>a little courage.</span></h1>
          <p>A quiet corner of the internet for big thoughts, small discoveries, and everything in between.</p>
          <div className="hero-ctas"><button className="btn btn-primary btn-large" onClick={openCreate}><Feather size={17} /> Start writing <ArrowUpRight size={16} /></button><button className="text-cta" onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })}>Discover stories <span>↓</span></button></div>
          <div className="hero-proof"><div className="proof-avatars"><span>J</span><span>A</span><span>M</span><span>+</span></div><span>Made for curious minds</span></div>
        </div>
        <div className="hero-art" aria-label="Decorative writing illustration">
          <div className="art-glow" /><div className="floating-note note-back"><span className="note-line wide" /><span className="note-line" /><span className="note-line short" /></div>
          <div className="journal"><div className="journal-spine" /><div className="journal-top"><span>FIELD NOTES</span><span>NO. 001</span></div><div className="journal-title">The art of<br /><i>noticing.</i></div><div className="journal-squiggle">〰</div><div className="journal-bottom"><span>IDEAS · PEOPLE · PLACES</span><Feather size={20} /></div></div>
          <div className="floating-tag tag-top"><span className="tag-dot" /> A thought worth sharing</div><div className="floating-tag tag-bottom"><BookOpen size={15} /> Make room for wonder.</div>
        </div>
      </section>

      <section className="stats-row"><div><strong>{posts.length.toString().padStart(2, '0')}</strong><span>STORIES SHARED</span></div><div className="stats-divider" /><div><strong>∞</strong><span>IDEAS TO EXPLORE</span></div><div className="stats-divider" /><div><strong>01</strong><span>PLACE TO BEGIN</span></div></section>

      <section className="stories-section" id="stories">
        <div className="section-heading"><div><div className="eyebrow muted">THE COMMUNITY JOURNAL</div><h2>Fresh from the <span>feed.</span></h2><p>Little windows into someone else's world.</p></div>
          <label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a story..." /><kbd>⌕</kbd></label>
        </div>
        {posts.length === 0 ? <div className="empty-state"><div className="empty-icon"><BookOpen size={26} /></div><h3>{query ? 'No stories found just yet.' : 'The first page is yours.'}</h3><p>{query ? 'Try another search, or explore a different idea.' : 'Be the first to share an idea with the InkSpace community.'}</p><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Write the first story</button></div> :
          <div className="stories-grid">
            {featured && <article className="featured-card">
              <div className="featured-image" style={featured.coverImage ? { backgroundImage: `url("${imageUrl(featured.coverImage)}")` } : {}}>
                {!featured.coverImage && <div className="image-placeholder"><span>THE JOURNAL</span><Feather size={44} /><b>Stories begin<br />with a spark.</b></div>}
                <span className="featured-label">LATEST STORY</span>
              </div>
              <div className="featured-content"><div className="post-meta"><span className="author-dot">{featured.author?.name?.[0]?.toUpperCase() || 'W'}</span><span>{featured.author?.name || 'Writer'}</span><span className="meta-dot">·</span><Clock3 size={13} /><span>{dateLabel(featured.createdAt)}</span></div>
                <h3>{featured.title}</h3><p>{excerpt(featured.content)}</p>
                <div className="card-footer"><button className="read-link" onClick={() => { setEditing(featured); setModal('read'); }}>Read story <ArrowUpRight size={15} /></button>
                {user?.id === featured.author?.id && <div className="post-actions"><button title="Edit post" onClick={() => openEdit(featured)}><Edit3 size={15} /></button><button title="Delete post" onClick={() => deletePost(featured)}><Trash2 size={15} /></button></div>}</div>
              </div>
            </article>}
            <div className="side-stories">{remaining.map((post, index) => <article className="story-row" key={post.id}>
              <div className={`story-thumb thumb-${index % 4}`} style={post.coverImage ? { backgroundImage: `url("${imageUrl(post.coverImage)}")` } : {}}>{!post.coverImage && <Feather size={25} />}</div>
              <div className="story-row-content"><div className="post-meta small-meta"><span>{post.author?.name || 'Writer'}</span><span className="meta-dot">·</span><span>{dateLabel(post.createdAt)}</span></div><h3>{post.title}</h3><p>{excerpt(post.content)}</p><div className="row-footer"><button className="read-link" onClick={() => { setEditing(post); setModal('read'); }}>Read story <ArrowUpRight size={14} /></button>
              {user?.id === post.author?.id && <div className="post-actions"><button title="Edit post" onClick={() => openEdit(post)}><Edit3 size={14} /></button><button title="Delete post" onClick={() => deletePost(post)}><Trash2 size={14} /></button></div>}</div></div>
            </article>)}</div>
          </div>}
      </section>
      <section className="closing-cta"><div className="closing-icon"><Feather size={22} /></div><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Have something on your mind?</h2><p>The world could use your perspective. Put it into words.</p></div><button className="btn btn-light" onClick={openCreate}>Share your story <ArrowUpRight size={16} /></button></section>
    </main>
    <footer><a className="footer-brand" href="#" onClick={e => e.preventDefault()}><Feather size={16} /> inkspace</a><span>Made for stories that matter.</span><span>© 2026 InkSpace</span></footer>

    {notice && <div className="toast"><span className="toast-dot" />{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}

    {modal === 'auth' && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(''); }}><div className="modal auth-modal"><button className="modal-close" onClick={() => setModal('')}><X size={19} /></button><div className="modal-symbol"><Feather size={23} /></div><div className="eyebrow muted">{authMode === 'login' ? 'GOOD TO HAVE YOU BACK' : 'YOUR STORY STARTS HERE'}</div><h2>{authMode === 'login' ? 'Welcome back.' : 'Join the journal.'}</h2><p className="modal-subtitle">{authMode === 'login' ? 'Sign in and pick up where you left off.' : 'Create an account to publish your first story.'}</p>
      <form onSubmit={submitAuth} className="form-stack">{authMode === 'register' && <label>Your name<input required minLength="2" maxLength="60" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="How should we call you?" /></label>}<label>Email address<input type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" /></label><label>Password<input type="password" required minLength="6" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 6 characters" /></label><button className="btn btn-primary submit-btn" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in to InkSpace' : 'Create my account'}</button></form>
      <div className="switch-auth">{authMode === 'login' ? 'New around here?' : 'Already have an account?'} <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></div></div></div>}

    {modal === 'post' && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(''); }}><div className="modal post-modal"><button className="modal-close" onClick={() => setModal('')}><X size={19} /></button><div className="eyebrow muted">{editing ? 'REFINE YOUR WORDS' : 'A BLANK PAGE, A NEW POSSIBILITY'}</div><h2>{editing ? 'Edit your story.' : 'Write a story.'}</h2><p className="modal-subtitle">Make yourself comfortable. This is your space.</p>
      <form onSubmit={submitPost} className="form-stack"><label>Story title<input required minLength="3" maxLength="140" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} placeholder="Give your story a name..." /></label>
      <label className="editor-label">Your story<ReactQuill ref={quillRef} theme="snow" value={postForm.content} onChange={content => setPostForm({ ...postForm, content })} modules={modules} placeholder="Start with a thought, a memory, a question..." /></label>
      <div className="upload-row"><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => setCover(e.target.files?.[0] || null)} /><button type="button" className="upload-button" onClick={() => fileRef.current?.click()}><ImagePlus size={18} /><span><b>{cover ? cover.name : 'Add a cover image'}</b><small>{cover ? 'Image selected · click to change' : 'JPG, PNG, WEBP or GIF · up to 5 MB'}</small></span></button>{editing?.coverImage && !cover && <span className="existing-cover">Current cover kept</span>}</div>
      <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setModal('')}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish story'} <ArrowUpRight size={15} /></button></div></form></div></div>}

    {modal === 'read' && editing && <div className="modal-backdrop read-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(''); }}><article className="modal read-modal"><button className="modal-close" onClick={() => setModal('')}><X size={19} /></button>{editing.coverImage && <img className="read-cover" src={imageUrl(editing.coverImage)} alt="" />}<div className="eyebrow muted">A STORY FROM INKSPACE</div><h2>{editing.title}</h2><div className="read-byline"><span className="author-dot">{editing.author?.name?.[0]?.toUpperCase() || 'W'}</span><span>{editing.author?.name || 'Writer'}</span><span>·</span><span>{dateLabel(editing.createdAt)}</span></div><div className="read-content" dangerouslySetInnerHTML={{ __html: editing.content }} />{user?.id === editing.author?.id && <div className="modal-actions"><button className="btn btn-outline" onClick={() => openEdit(editing)}><Edit3 size={15} /> Edit story</button><button className="btn btn-danger" onClick={() => { setModal(''); deletePost(editing); }}><Trash2 size={15} /> Delete</button></div>}</article></div>}
  </div>;
}
