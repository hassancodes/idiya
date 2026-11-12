import { collection, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { PostComponent } from './postcomponent';

const feedFilters = [
  { id: 'all', label: 'Everything' },
  { id: 'image', label: 'Photos' },
  { id: 'video', label: 'Videos' },
];

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'I';

export const Home = () => {
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const postsRef = useMemo(() => collection(db, 'posts'), []);

  const getPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(postsRef);
      const fetchedPosts = snapshot.docs.map((postDoc) => ({
        ...postDoc.data(),
        id: postDoc.id,
      }));
      fetchedPosts.sort(
        (first, second) =>
          (second.createdAt?.toMillis?.() || 0) - (first.createdAt?.toMillis?.() || 0),
      );
      setPosts(fetchedPosts);
    } catch (loadError) {
      console.error('Unable to load posts:', loadError);
      setError('We couldn’t load the feed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [postsRef]);

  useEffect(() => {
    getPosts();
  }, [getPosts]);

  const filteredPosts = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();
    return posts.filter((post) => {
      const matchesFilter = activeFilter === 'all' || post.mediaType === activeFilter;
      const searchableText = `${post.title || ''} ${post.description || ''} ${post.username || ''}`.toLocaleLowerCase();
      return matchesFilter && (!searchTerm || searchableText.includes(searchTerm));
    });
  }, [activeFilter, posts, search]);

  return (
    <main className="page-shell">
      <div className="feed-layout">
        <aside className="left-rail">
          <div className="rail-card rail-intro">
            <p className="eyebrow">A little more connection</p>
            <h2>Ideas are better when they’re shared.</h2>
            <p>Find a spark, share a thought, and see where it takes you.</p>
          </div>
          <div className="rail-card rail-links">
            <p className="rail-label">YOUR SPACE</p>
            <Link to="/" className="rail-link is-active"><span aria-hidden="true">⌂</span> Discover</Link>
            {user ? (
              <Link to="/create-post" className="rail-link"><span aria-hidden="true">＋</span> Create a post</Link>
            ) : (
              <Link to="/login" className="rail-link"><span aria-hidden="true">↗</span> Join the conversation</Link>
            )}
          </div>
          <p className="rail-footnote">Make room for good ideas.</p>
        </aside>

        <section className="feed-column" aria-label="Community feed">
          <div className="feed-heading">
            <div>
              <p className="eyebrow">THE COMMUNITY</p>
              <h1>Your daily dose of <span>inspiration.</span></h1>
              <p className="feed-subtitle">A place for the things you’re thinking about.</p>
            </div>
            <button type="button" className="icon-button refresh-button" onClick={getPosts} aria-label="Refresh feed">
              <span aria-hidden="true">↻</span>
            </button>
          </div>

          {user ? (
            <Link to="/create-post" className="quick-compose">
              {user.photoURL ? (
                <img className="avatar" src={user.photoURL} alt="" />
              ) : (
                <span className="avatar avatar-fallback">{getInitials(user.displayName)}</span>
              )}
              <span className="quick-compose-prompt">What’s on your mind, {user.displayName?.split(' ')[0] || 'friend'}?</span>
              <span className="quick-compose-action" aria-hidden="true">＋</span>
            </Link>
          ) : (
            <div className="guest-callout">
              <span className="guest-callout-icon" aria-hidden="true">✦</span>
              <div>
                <strong>Good things start with a thought.</strong>
                <p>Sign in to share yours with the community.</p>
              </div>
              <Link to="/login" className="button button-primary">Join in</Link>
            </div>
          )}

          <div className="feed-toolbar">
            <div className="feed-tabs" role="group" aria-label="Filter feed">
              {feedFilters.map((filter) => (
                <button
                  type="button"
                  key={filter.id}
                  className={`feed-tab${activeFilter === filter.id ? ' is-active' : ''}`}
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={activeFilter === filter.id}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="feed-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search the feed"
                aria-label="Search posts"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {error ? (
            <div className="state-card error-card" role="alert">
              <span className="state-icon" aria-hidden="true">!</span>
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <button type="button" className="button button-primary" onClick={getPosts}>Try again</button>
            </div>
          ) : loading ? (
            <div className="state-card loading-card" role="status">
              <span className="loading-spinner" />
              <p>Finding something good…</p>
            </div>
          ) : filteredPosts.length ? (
            <div className="post-list">
              {filteredPosts.map((post) => (
                <PostComponent key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="state-card empty-card">
              <span className="state-icon" aria-hidden="true">{search ? '⌕' : '✦'}</span>
              <h2>{search ? 'No matching posts' : posts.length ? 'Nothing in this view yet' : 'A fresh page, a fresh start.'}</h2>
              <p>
                {search
                  ? 'Try another phrase or clear your search.'
                  : posts.length
                    ? 'Try another filter, or be the first to share something here.'
                    : 'Be the first to share an idea with the community.'}
              </p>
              {user && !search && (
                <Link to="/create-post" className="button button-primary">Share your first post <span aria-hidden="true">↗</span></Link>
              )}
            </div>
          )}

          <footer className="feed-footer">You’re all caught up <span aria-hidden="true">✦</span></footer>
        </section>

        <aside className="right-rail">
          <div className="rail-card welcome-card">
            <span className="welcome-orb" aria-hidden="true">✦</span>
            <p className="eyebrow">A NOTE FROM IDIYA</p>
            <h2>Make space for what matters.</h2>
            <p>Thoughtful stories, small discoveries, and the ideas that bring us closer.</p>
          </div>
          <div className="rail-card community-card">
            <p className="rail-label">A GOOD PLACE TO START</p>
            <div className="tip-item"><span>01</span><p>Share what you’re learning.</p></div>
            <div className="tip-item"><span>02</span><p>Be kind in the comments.</p></div>
            <div className="tip-item"><span>03</span><p>Give good ideas a little love.</p></div>
          </div>
          <p className="rail-footnote">Idiya · A space to share</p>
        </aside>
      </div>
    </main>
  );
};
