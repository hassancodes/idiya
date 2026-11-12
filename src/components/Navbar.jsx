import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'I';

export const Navbar = () => {
  const [user] = useAuthState(auth);
  const [signOutError, setSignOutError] = useState('');

  const signUserOut = async () => {
    setSignOutError('');
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Unable to sign out:', error);
      setSignOutError('Could not sign out. Please try again.');
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/" aria-label="Idiya home">
            <span className="brand-mark">i</span>
            <span>idiya<span className="brand-period">.</span></span>
          </Link>

          <nav className="primary-nav" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">⌂</span>
              <span>Discover</span>
            </NavLink>
            {user && (
              <NavLink to="/create-post" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
                <span className="nav-icon" aria-hidden="true">＋</span>
                <span>Create</span>
              </NavLink>
            )}
          </nav>

          <div className="topbar-actions">
            {user ? (
              <>
                <Link to="/create-post" className="button button-primary topbar-create">
                  <span aria-hidden="true">＋</span> Create post
                </Link>
                <div className="account-menu">
                  <div className="user-chip" title={user.displayName || 'Your account'}>
                    {user.photoURL ? (
                      <img className="avatar avatar-small" src={user.photoURL} alt="" />
                    ) : (
                      <span className="avatar avatar-small avatar-fallback">{getInitials(user.displayName)}</span>
                    )}
                    <span className="user-chip-name">{user.displayName || 'Your account'}</span>
                  </div>
                  <button type="button" className="button button-quiet signout-button" onClick={signUserOut}>
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="button button-primary">
                Sign in <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
        </div>
        {signOutError && <p className="topbar-error" role="alert">{signOutError}</p>}
      </header>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}>
          <span aria-hidden="true">⌂</span>Home
        </NavLink>
        {user ? (
          <NavLink to="/create-post" className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}>
            <span aria-hidden="true">＋</span>Create
          </NavLink>
        ) : (
          <NavLink to="/login" className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}>
            <span aria-hidden="true">↗</span>Sign in
          </NavLink>
        )}
      </nav>
    </>
  );
};
