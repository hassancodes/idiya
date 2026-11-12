import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { Navbar } from './components/Navbar';
import { CreatePost } from './pages/create-post/CreatePost';
import { Home } from './pages/home/Home';
import { Login } from './pages/Login';
import './App.css';

function App() {
  const [user, loading] = useAuthState(auth);

  return (
    <Router>
      <Navbar />
      {loading ? (
        <main className="app-loading" role="status">
          <span className="loading-spinner" />
          <span>Getting your space ready…</span>
        </main>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/create-post" element={user ? <CreatePost /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
