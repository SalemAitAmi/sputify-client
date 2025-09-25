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

// Refresh token API call
export const refreshToken = async (refreshToken) => {
  const response = await fetch(`${process.env.REACT_APP_AUTH_SERVER_URL}/refresh_token?refresh_token=${encodeURIComponent(refreshToken)}`);
  
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  
  return response.json();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const tokens = localStorage.getItem('spotifyTokens');
  if (!tokens) return false;
  
  try {
    const parsed = JSON.parse(tokens);
    return parsed.accessToken && parsed.expiresAt > Date.now();
  } catch {
    return false;
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('spotifyTokens');
  window.location.href = '/';
};