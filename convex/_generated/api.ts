/**
 * Temporary fallback API references for local/frontend builds.
 *
 * In production and CI, replace this by running `npx convex codegen`
 * after configuring a Convex deployment.
 */

export const api = {
  highlights: {
    list: "highlights:list",
    summary: "highlights:summary",
    create: "highlights:create",
    remove: "highlights:remove",
  },
} as any;
