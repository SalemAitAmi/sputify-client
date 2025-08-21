import { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpotifyProvider } from './contexts/SpotifyContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Stats from './pages/Stats';
import RecentlyPlayed from './pages/RecentlyPlayed';
import Library from './pages/Library';
import { getHashParams, clearHashParams } from './utils/auth';
import './App.css';
import './styles/shared.css';
import './styles/grid-fix.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for tokens in URL hash
    const hashParams = getHashParams();
    if (hashParams.access_token && hashParams.refresh_token) {
      const tokens = {
        accessToken: hashParams.access_token,
        refreshToken: hashParams.refresh_token,
        expiresAt: Date.now() + (hashParams.expires_in || 3600) * 1000
      };
      localStorage.setItem('spotifyTokens', JSON.stringify(tokens));
      setIsAuthenticated(true);
      clearHashParams();
    } else {
      // Check for existing tokens
      const storedTokens = localStorage.getItem('spotifyTokens');
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        if (tokens.expiresAt > Date.now()) {
          setIsAuthenticated(true);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('spotifyTokens');
    setIsAuthenticated(false);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Spütify...</p>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider value={{ isAuthenticated, setIsAuthenticated, handleLogout }}>
        <SpotifyProvider>
          <div className="App">
            {!isAuthenticated ? (
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/stats" replace />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/recently-played" element={<RecentlyPlayed />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="*" element={<Navigate to="/stats" replace />} />
                </Routes>
              </Layout>
            )}
          </div>
        </SpotifyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
