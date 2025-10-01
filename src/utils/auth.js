// Parse hash parameters from URL
export const getHashParams = () => {
  const hashParams = {};
  const hash = window.location.hash.substring(1);
  const params = hash.split('&');
  
  params.forEach(param => {
    const [key, value] = param.split('=');
    if (key) {
      hashParams[key] = decodeURIComponent(value || '');
    }
  });
  
  return hashParams;
};

// Clear hash parameters from URL
export const clearHashParams = () => {
  const url = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, url);
};

// Get tokens from server cookies
export const getTokensFromServer = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_AUTH_SERVER_URL}/api/tokens`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get tokens from server:', error);
    return null;
  }
};

// Refresh token API call using cookies
export const refreshToken = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_AUTH_SERVER_URL}/api/refresh_token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    
    // Get updated tokens from server
    const tokens = await getTokensFromServer();
    if (tokens) {
      localStorage.setItem('spotifyTokens', JSON.stringify(tokens));
      return { 
        access_token: tokens.accessToken, 
        expires_in: data.expires_in 
      };
    }
    
    throw new Error('Failed to retrieve refreshed tokens');
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear local storage on refresh failure
    localStorage.removeItem('spotifyTokens');
    throw error;
  }
};

// Check if user is authenticated and token is valid
export const isAuthenticated = () => {
  const tokens = localStorage.getItem('spotifyTokens');
  if (!tokens) return false;
  
  try {
    const parsed = JSON.parse(tokens);
    // Check if token exists and is not expired (with 5 minute buffer)
    return parsed.accessToken && (parsed.expiresAt - Date.now() > 5 * 60 * 1000);
  } catch {
    return false;
  }
};

// Check if token needs refresh
export const needsTokenRefresh = () => {
  const tokens = localStorage.getItem('spotifyTokens');
  if (!tokens) return false;
  
  try {
    const parsed = JSON.parse(tokens);
    // Refresh if expires in less than 5 minutes
    return parsed.accessToken && (parsed.expiresAt - Date.now() <= 5 * 60 * 1000);
  } catch {
    return false;
  }
};

// Logout user - Fixed to use hash routing
export const logout = async () => {
  try {
    await fetch(`${process.env.REACT_APP_AUTH_SERVER_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  localStorage.removeItem('spotifyTokens');
  // Use hash routing for GitHub Pages compatibility
  window.location.href = window.location.origin + window.location.pathname + '#/';
};