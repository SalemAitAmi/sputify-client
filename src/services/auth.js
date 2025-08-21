export const refreshToken = async (refreshToken) => {
  try {
    const response = await fetch(`https://sputify.app/api/refresh_token?refresh_token=${encodeURIComponent(refreshToken)}`);
    
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
  
  window.location.href = `https://sputify.app/api/login?redirectTo=${encodeURIComponent(redirectTo)}&scope=${encodeURIComponent(scopes)}`;
};