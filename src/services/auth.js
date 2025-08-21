// Get API base URL from environment or use production server
const API_BASE_URL = process.env.API_URL;

export const refreshToken = async (refreshToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/refresh_token?refresh_token=${encodeURIComponent(refreshToken)}`);
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const login = () => {
  const redirectTo = window.location.origin;
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'playlist-read-private',
    'user-follow-read',
    'user-read-playback-state',
    'user-library-read',
    'user-library-modify',
    'user-follow-modify'
  ].join(' ');
  
  window.location.href = `${API_BASE_URL}/api/login?redirectTo=${encodeURIComponent(redirectTo)}&scope=${encodeURIComponent(scopes)}`;
};