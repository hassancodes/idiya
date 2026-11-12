import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, db, storage } from '../../config/firebase';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

const postSchema = yup.object({
  title: yup.string().max(100, 'Keep the title under 100 characters.'),
  description: yup.string().max(1000, 'Keep your post under 1,000 characters.'),
});

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'I';

const sanitizeFileName = (name) =>
  name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(-100);

export const CreateForm = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ resolver: yupResolver(postSchema), defaultValues: { title: '', description: '' } });

  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(mediaFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  const selectMedia = (event) => {
    const file = event.target.files?.[0];
    setMediaError('');
    setPublishError('');
    setMediaFile(null);

    if (!file) return;
    if (![...allowedImageTypes, ...allowedVideoTypes].includes(file.type)) {
      setMediaError('Choose a JPG, PNG, GIF, WebP, AVIF, MP4, WebM, or MOV file.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMediaError('That file is over 50 MB. Choose a smaller photo or video.');
      event.target.value = '';
      return;
    }
    setMediaFile(file);
  };

  const uploadMedia = (file) =>
    new Promise((resolve, reject) => {
      const fileName = sanitizeFileName(file.name) || 'upload';
      const mediaRef = ref(storage, `posts/${user.uid}/${Date.now()}-${fileName}`);
      const uploadTask = uploadBytesResumable(mediaRef, file, {
        contentType: file.type,
        cacheControl: 'public,max-age=31536000',
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        },
        reject,
        async () => {
          try {
            resolve({
              mediaUrl: await getDownloadURL(uploadTask.snapshot.ref),
              mediaPath: uploadTask.snapshot.ref.fullPath,
              mediaType: allowedVideoTypes.includes(file.type) ? 'video' : 'image',
            });
          } catch (error) {
            reject(error);
          }
        },
      );
    });

  const onCreatePost = async ({ title = '', description = '' }) => {
    setPublishError('');
    if (!user) {
      navigate('/login');
      return;
    }

    if (!title.trim() && !description.trim() && !mediaFile) {
      setError('description', {
        type: 'required',
        message: 'Add a thought or attach a photo or video to share.',
      });
      return;
    }

    clearErrors('description');
    setIsPublishing(true);
    setUploadProgress(0);
    let uploadedMedia;

    try {
      if (mediaFile) uploadedMedia = await uploadMedia(mediaFile);

      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        description: description.trim(),
        username: user.displayName || 'Community member',
        id: user.uid,
        profileUrl: user.photoURL || '',
        createdAt: serverTimestamp(),
        ...(uploadedMedia || {}),
      });

      reset();
      setMediaFile(null);
      navigate('/');
    } catch (error) {
      console.error('Unable to publish post:', error);
      if (uploadedMedia?.mediaPath) {
        try {
          await deleteObject(ref(storage, uploadedMedia.mediaPath));
        } catch (cleanupError) {
          console.error('Unable to clean up uploaded media after a failed post:', cleanupError);
        }
      }
      setPublishError(
        error.code === 'storage/unauthorized'
          ? 'Upload was blocked by Firebase Storage rules. Check that signed-in users can upload to their own posts.'
          : error.code === 'storage/bucket-not-found'
            ? 'Firebase Storage is not enabled for this project yet.'
            : 'Your post could not be published. Please try again.',
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaError('');
    const input = document.getElementById('post-media');
    if (input) input.value = '';
  };

  return (
    <main className="page-shell composer-page">
      <div className="composer-layout">
        <section className="composer-main">
          <div className="composer-heading">
            <Link to="/" className="back-link"><span aria-hidden="true">←</span> Back to the feed</Link>
            <p className="eyebrow">YOUR SPACE, YOUR STORY</p>
            <h1>Share what’s <span>on your mind.</span></h1>
            <p>Big idea, little moment, or something you made—there’s room for it here.</p>
          </div>

          <form className="composer-card" onSubmit={handleSubmit(onCreatePost)}>
            <div className="composer-author">
              {user?.photoURL ? (
                <img className="avatar" src={user.photoURL} alt="" />
              ) : (
                <span className="avatar avatar-fallback">{getInitials(user?.displayName)}</span>
              )}
              <div>
                <strong>{user?.displayName || 'Your profile'}</strong>
                <span>Sharing with the Idiya community</span>
              </div>
              <span className="visibility-pill"><span aria-hidden="true">◉</span> Everyone</span>
            </div>

            <label className="composer-title-label" htmlFor="post-title">Give it a title <span>Optional</span></label>
            <input
              id="post-title"
              className="composer-title-input"
              type="text"
              maxLength={100}
              placeholder="A short, memorable headline"
              {...register('title')}
              disabled={isPublishing}
            />
            {errors.title && <p className="field-error" role="alert">{errors.title.message}</p>}

            <label className="visually-hidden" htmlFor="post-description">Write your post</label>
            <textarea
              id="post-description"
              className="composer-textarea"
              rows={6}
              maxLength={1000}
              placeholder="Start with a thought, a story, or something you’re curious about…"
              {...register('description')}
              disabled={isPublishing}
            />
            <div className="composer-meta">
              {errors.description || mediaError ? (
                <span className="field-error" role="alert">{errors.description?.message || mediaError}</span>
              ) : (
                <span>Keep it kind. Keep it you.</span>
              )}
              <span className="character-limit">Up to 1,000 characters</span>
            </div>

            {previewUrl && mediaFile && (
              <div className="media-preview">
                {mediaFile.type.startsWith('video/') ? (
                  <video src={previewUrl} controls playsInline aria-label="Video preview" />
                ) : (
                  <img src={previewUrl} alt="Selected photo preview" />
                )}
                <div className="media-preview-info">
                  <span>{mediaFile.name} · {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                  <button type="button" className="remove-media-button" onClick={removeMedia} disabled={isPublishing}>
                    Remove
                  </button>
                </div>
              </div>
            )}

            {isPublishing && mediaFile && (
              <div className="upload-progress" role="status" aria-live="polite">
                <div className="upload-progress-label"><span>Uploading your media</span><span>{uploadProgress}%</span></div>
                <progress value={uploadProgress} max="100">{uploadProgress}%</progress>
              </div>
            )}

            {publishError && <p className="publish-error" role="alert">{publishError}</p>}

            <div className="composer-actions">
              <label className={`media-picker${isPublishing ? ' is-disabled' : ''}`} htmlFor="post-media">
                <span aria-hidden="true">▧</span> Add photo or video
              </label>
              <input
                id="post-media"
                className="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
                onChange={selectMedia}
                disabled={isPublishing}
              />
              <span className="media-limit">Up to 50 MB</span>
              <button type="submit" className="button button-primary publish-button" disabled={isPublishing}>
                {isPublishing ? (
                  <><span className="button-spinner" /> Sharing…</>
                ) : (
                  <>Share post <span aria-hidden="true">↗</span></>
                )}
              </button>
            </div>
          </form>
        </section>

        <aside className="composer-aside">
          <div className="rail-card composer-guidelines">
            <span className="welcome-orb" aria-hidden="true">✦</span>
            <p className="eyebrow">A LITTLE REMINDER</p>
            <h2>Make it a good place to be.</h2>
            <ul>
              <li><span>✦</span> Be curious and kind.</li>
              <li><span>✦</span> Respect everyone’s perspective.</li>
              <li><span>✦</span> Only share content you have permission to post.</li>
            </ul>
          </div>
          <div className="rail-card media-note">
            <p className="rail-label">YOUR MEDIA, YOURS</p>
            <p>Photos and videos are shared with your post. Keep uploads under 50 MB for the best experience.</p>
          </div>
        </aside>
      </div>
    </main>
  );
};
