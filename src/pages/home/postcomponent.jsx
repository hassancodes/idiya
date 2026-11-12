import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { Comment } from './comment';

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'I';

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();
  if (!date) return 'Just shared';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

export const PostComponent = ({ post }) => {
  const [user] = useAuthState(auth);
  const [likes, setLikes] = useState([]);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [actionError, setActionError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const likeRef = useMemo(() => collection(db, 'likes'), []);
  const postLikesQuery = useMemo(
    () => query(likeRef, where('postId', '==', post.id)),
    [likeRef, post.id],
  );

  const getLikes = useCallback(async () => {
    try {
      const snapshot = await getDocs(postLikesQuery);
      setLikes(snapshot.docs.map((likeDoc) => ({ id: likeDoc.data().id, likeId: likeDoc.id })));
    } catch (error) {
      console.error('Unable to load post likes:', error);
      setActionError('Likes are unavailable right now.');
    } finally {
      setLikesLoaded(true);
    }
  }, [postLikesQuery]);

  useEffect(() => {
    getLikes();
  }, [getLikes]);

  const userLike = likes.find((like) => like.id === user?.uid);

  const toggleLike = async () => {
    if (!user) return;
    if (likeBusy) return;

    setLikeBusy(true);
    setActionError('');
    try {
      if (userLike) {
        await deleteDoc(doc(db, 'likes', userLike.likeId));
        setLikes((previous) => previous.filter((like) => like.likeId !== userLike.likeId));
      } else {
        const existingLike = query(
          likeRef,
          where('postId', '==', post.id),
          where('id', '==', user.uid),
        );
        const existingSnapshot = await getDocs(existingLike);
        if (existingSnapshot.empty) {
          const createdLike = await addDoc(likeRef, { id: user.uid, postId: post.id });
          setLikes((previous) => [...previous, { id: user.uid, likeId: createdLike.id }]);
        } else {
          setLikes((previous) => [
            ...previous,
            ...existingSnapshot.docs.map((likeDoc) => ({
              id: likeDoc.data().id,
              likeId: likeDoc.id,
            })),
          ]);
        }
      }
    } catch (error) {
      console.error('Unable to update post like:', error);
      setActionError('Could not update your like. Please try again.');
    } finally {
      setLikeBusy(false);
    }
  };

  const sharePost = async () => {
    setShareMessage('');
    const url = `${window.location.origin}/#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title || 'A post on Idiya', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage('Link copied');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Unable to share post:', error);
        setShareMessage('Sharing is unavailable');
      }
    }
  };

  return (
    <article className="post-card" id={`post-${post.id}`}>
      <header className="post-header">
        {post.profileUrl ? (
          <img className="avatar" src={post.profileUrl} alt="" />
        ) : (
          <span className="avatar avatar-fallback">{getInitials(post.username)}</span>
        )}
        <div className="post-author">
          <strong>{post.username || 'A community member'}</strong>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        {post.mediaType && (
          <span className="post-kind">
            <span aria-hidden="true">{post.mediaType === 'video' ? '▶' : '▧'}</span>
            {post.mediaType === 'video' ? 'Video' : 'Photo'}
          </span>
        )}
      </header>

      <div className="post-content">
        {post.title && <h2 className="post-title">{post.title}</h2>}
        {post.description && <p className="post-copy">{post.description}</p>}
      </div>

      {post.mediaUrl && (
        <div className={`post-media${post.mediaType === 'video' ? ' post-media-video' : ''}`}>
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls playsInline preload="metadata" aria-label={post.title || 'Community video'} />
          ) : (
            <img src={post.mediaUrl} alt={post.title || post.description || 'Community photo'} loading="lazy" />
          )}
        </div>
      )}

      <div className="post-actions">
        <div className="post-actions-left">
          {user ? (
            <button
              type="button"
              className={`post-action${userLike ? ' is-liked' : ''}`}
              onClick={toggleLike}
              disabled={!likesLoaded || likeBusy}
              aria-label={userLike ? 'Unlike post' : 'Like post'}
              aria-pressed={Boolean(userLike)}
            >
              <span className="action-icon" aria-hidden="true">{userLike ? '♥' : '♡'}</span>
              <span>{likes.length}</span>
            </button>
          ) : (
            <Link to="/login" className="post-action" aria-label={`Sign in to like this post; ${likes.length} likes`}>
              <span className="action-icon" aria-hidden="true">♡</span>
              <span>{likes.length}</span>
            </Link>
          )}
          <button
            type="button"
            className={`post-action${showComments ? ' is-selected' : ''}`}
            onClick={() => setShowComments((previous) => !previous)}
            aria-expanded={showComments}
          >
            <span className="action-icon" aria-hidden="true">▤</span>
            <span>{showComments ? 'Hide comments' : 'Comments'}</span>
          </button>
        </div>
        <button type="button" className="post-action share-action" onClick={sharePost}>
          <span className="action-icon" aria-hidden="true">↗</span>
          <span>Share</span>
        </button>
      </div>

      {(actionError || shareMessage) && (
        <p className={`post-feedback${actionError ? ' has-error' : ''}`} role={actionError ? 'alert' : 'status'}>
          {actionError || shareMessage}
        </p>
      )}

      {showComments && <Comment PostId={post.id} />}
    </article>
  );
};

PostComponent.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string,
    profileUrl: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    mediaUrl: PropTypes.string,
    mediaType: PropTypes.oneOf(['image', 'video']),
    createdAt: PropTypes.object,
  }).isRequired,
};
