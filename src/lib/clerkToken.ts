export const getClerkToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  const clerk = (window as typeof window & { Clerk?: any }).Clerk;
  if (!clerk?.session) {
    return null;
  }

  try {
    return await clerk.session.getToken({ template: 'convex' });
  } catch (error) {
    console.error('Failed to get Clerk token:', error);
    return null;
  }
};
