import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const commentSchema = yup.object({
  commentText: yup.string().trim().required('Write a comment first.').max(300, 'Comments are limited to 300 characters.'),
});

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();
  if (!date) return 'Just now';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'I';

export const Comment = ({ PostId }) => {
  const [user] = useAuthState(auth);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const commentRef = useMemo(() => collection(db, 'Comments'), []);
  const postCommentsQuery = useMemo(
    () => query(commentRef, where('postIDComment', '==', PostId)),
    [commentRef, PostId],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(commentSchema) });

  useEffect(() => {
    setLoading(true);
    setLoadError('');

    return onSnapshot(
      postCommentsQuery,
      (snapshot) => {
        const nextComments = snapshot.docs.map((commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data(),
        }));
        nextComments.sort(
          (first, second) =>
            (first.commentCreatedAt?.toMillis?.() || 0) - (second.commentCreatedAt?.toMillis?.() || 0),
        );
        setComments(nextComments);
        setLoading(false);
      },
      (error) => {
        console.error('Unable to load comments:', error);
        setLoadError('Comments are unavailable right now.');
        setLoading(false);
      },
    );
  }, [postCommentsQuery]);

  const postComment = useCallback(async ({ commentText }) => {
    if (!user) return;

    setSubmitError('');
    try {
      await addDoc(commentRef, {
        commentText: commentText.trim(),
        postIDComment: PostId,
        username: user.displayName || 'Community member',
        profileUrl: user.photoURL || '',
        authorId: user.uid,
        commentCreatedAt: serverTimestamp(),
        commentTime: new Date().toLocaleDateString(),
      });
      reset();
    } catch (error) {
      console.error('Unable to post comment:', error);
      setSubmitError('Your comment could not be posted. Please try again.');
    }
  }, [PostId, commentRef, reset, user]);

  return (
    <section className="comments-panel" aria-label="Post comments">
      {loading ? (
        <p className="comments-message">Loading conversation…</p>
      ) : loadError ? (
        <p className="comments-message comments-error" role="alert">{loadError}</p>
      ) : comments.length ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              {comment.profileUrl ? (
                <img className="avatar avatar-small" src={comment.profileUrl} alt="" />
              ) : (
                <span className="avatar avatar-small avatar-fallback">{getInitials(comment.username)}</span>
              )}
              <div className="comment-body">
                <div className="comment-meta">
                  <strong>{comment.username || 'Community member'}</strong>
                  <time>{formatDate(comment.commentCreatedAt)}</time>
                </div>
                <p>{comment.commentText}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="comments-message">No comments yet. Start the conversation.</p>
      )}

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit(postComment)}>
          {user.photoURL ? (
            <img className="avatar avatar-small" src={user.photoURL} alt="" />
          ) : (
            <span className="avatar avatar-small avatar-fallback">{getInitials(user.displayName)}</span>
          )}
          <div className="comment-input-wrap">
            <label className="visually-hidden" htmlFor={`comment-${PostId}`}>Write a comment</label>
            <input
              id={`comment-${PostId}`}
              type="text"
              maxLength={300}
              placeholder="Add a thoughtful comment…"
              {...register('commentText')}
            />
            <button type="submit" className="comment-submit" disabled={isSubmitting} aria-label="Post comment">
              {isSubmitting ? '…' : '↗'}
            </button>
            {(errors.commentText || submitError) && (
              <span className="field-error" role="alert">
                {errors.commentText?.message || submitError}
              </span>
            )}
          </div>
        </form>
      ) : (
        <p className="comments-signin">
          <Link to="/login">Sign in</Link> to join the conversation.
        </p>
      )}
    </section>
  );
};

Comment.propTypes = {
  PostId: PropTypes.string.isRequired,
};
