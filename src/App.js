import { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpotifyProvider } from './contexts/SpotifyContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Stats from './pages/Stats';
import RecentlyPlayed from './pages/RecentlyPlayed';
import Library from './pages/Library';
import { getHashParams, clearHashParams, getTokensFromServer } from './utils/auth';
import './App.css';
import './styles/shared.css';
import './styles/grid-fix.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for success/error in hash
        const hashParams = getHashParams();
        
        if (hashParams.success === 'true') {
          // Get tokens from server cookies
          const tokens = await getTokensFromServer();
          if (tokens) {
            localStorage.setItem('spotifyTokens', JSON.stringify(tokens));
            setIsAuthenticated(true);
            clearHashParams();
            setIsLoading(false);
            return;
          }
        }
        
        if (hashParams.error) {
          console.error('Auth error:', hashParams.error);
          clearHashParams();
          setIsLoading(false);
          return;
        }

        // Check for existing tokens in localStorage
        const storedTokens = localStorage.getItem('spotifyTokens');
        if (storedTokens) {
          try {
            const tokens = JSON.parse(storedTokens);
            
            // Check if token is expired or needs refresh
            if (tokens.expiresAt - Date.now() > 5 * 60 * 1000) {
              // Token is still valid
              setIsAuthenticated(true);
            } else {
              // Token expired, clear and redirect to login
              localStorage.removeItem('spotifyTokens');
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.error('Error parsing stored tokens:', error);
            localStorage.removeItem('spotifyTokens');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${process.env.REACT_APP_AUTH_SERVER_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear tokens and mark as unauthenticated
    localStorage.removeItem('spotifyTokens');
    setIsAuthenticated(false);
    // Force navigation to landing page
    window.location.href = window.location.origin + window.location.pathname + '#/';
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