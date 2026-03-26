type TokenGetter = (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>;

export const getClerkToken = async (tokenGetter?: TokenGetter): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    if (tokenGetter) {
      // Prefer explicit hook-provided getter when available
      const direct = await tokenGetter({ template: 'convex' });
      if (direct) {
        return direct;
      }

      // Fallback to default session token if template token is unavailable
      return await tokenGetter({ skipCache: true });
    }

    const clerk = (window as typeof window & { Clerk?: any }).Clerk;
    if (!clerk?.session) {
      return null;
    }

    const templateToken = await clerk.session.getToken({ template: 'convex' });
    if (templateToken) {
      return templateToken;
    }

    return await clerk.session.getToken();
  } catch (error) {
    console.error('Failed to get Clerk token:', error);
    return null;
  }
};
