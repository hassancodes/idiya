import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../config/firebase';

export const Login = () => {
  const [signInError, setSignInError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithGoogle = async () => {
    setSignInError('');
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setSignInError(
        error.code === 'auth/popup-closed-by-user'
          ? 'The sign-in window was closed before finishing.'
          : 'We couldn’t sign you in. Please try again.',
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-shape art-shape-one" />
          <div className="art-shape art-shape-two" />
          <div className="art-note art-note-one">a thought<br />becomes a spark <span>✦</span></div>
          <div className="art-note art-note-two">hello,<br />new idea <span>↗</span></div>
          <div className="art-caption">A little space for your big ideas.</div>
        </div>

        <div className="login-content">
          <Link className="brand login-brand" to="/">
            <span className="brand-mark">i</span>
            <span>idiya<span className="brand-period">.</span></span>
          </Link>
          <p className="eyebrow">WELCOME TO YOUR SPACE</p>
          <h1>Ideas are better <span>together.</span></h1>
          <p className="login-description">
            Find inspiration, share a moment, and meet people who see the world a little differently.
          </p>

          <button type="button" className="button button-google" onClick={signInWithGoogle} disabled={isSigningIn}>
            {isSigningIn ? (
              <><span className="button-spinner" /> Connecting…</>
            ) : (
              <>
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.66 17.74 9.5 24 9.5Z" transform="translate(0 5)" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.47-4.76 7.16l7.73 6C44.42 38.01 47 31.96 47 24.55Z" transform="translate(0 -1)" />
                  <path fill="#FBBC05" d="M10.53 28.41A14.4 14.4 0 0 1 9.75 24c0-1.53.27-3.01.75-4.41l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.37Z" transform="translate(1)" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.82l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.16-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -5)" />
                </svg>
                Continue with Google
              </>
            )}
          </button>
          {signInError && <p className="login-error" role="alert">{signInError}</p>}

          <p className="login-terms">
            By continuing, you agree to keep Idiya welcoming, thoughtful, and respectful for everyone.
          </p>
          <Link to="/" className="browse-link"><span aria-hidden="true">←</span> Browse the community first</Link>
        </div>
      </section>
    </main>
  );
};
