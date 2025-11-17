import { auth } from './firebase';

/**
 * Get the current Firebase ID token for authenticated requests.
 * Returns null if user is not authenticated or Firebase is not configured.
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    // If Firebase is not configured, return null (backend DEV_MODE will handle it)
    if (!auth || !auth.currentUser) {
      console.log('ℹ️ No authenticated user (Firebase may not be configured)');
      return null;
    }

    // Get fresh token (will refresh if expired)
    const token = await auth.currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('❌ Failed to get auth token:', error);
    return null;
  }
};

/**
 * Get headers for authenticated API requests.
 * Includes Authorization header with Bearer token if user is authenticated.
 */
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
