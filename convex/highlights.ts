import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    documentId: v.string(),
    content: v.string(),
    color: v.optional(v.string()),
    pageNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    const color = args.color || 'yellow';
    const highlightId = await ctx.db.insert('highlights', {
      userId: identity.subject,
      documentId: args.documentId,
      content: args.content,
      color,
      pageNumber: args.pageNumber,
      createdAt: Date.now(),
    });

    return highlightId;
  },
});

export const list = query({
  args: {
    documentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    if (!args.documentId) {
      return [];
    }

    return await ctx.db
      .query('highlights')
      .withIndex('by_user_document', (q) =>
        q.eq('userId', identity.subject).eq('documentId', args.documentId!)
      )
      .order('desc')
      .collect();
  },
});

export const summary = query({
  args: {
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    const highlights = await ctx.db
      .query('highlights')
      .withIndex('by_user_document', (q) =>
        q.eq('userId', identity.subject).eq('documentId', args.documentId)
      )
      .order('desc')
      .collect();

    const byColor: Record<string, typeof highlights> = {};
    for (const h of highlights) {
      const color = h.color || 'yellow';
      if (!byColor[color]) {
        byColor[color] = [];
      }
      byColor[color].push(h);
    }

    return {
      total: highlights.length,
      byColor,
    };
  },
});

export const remove = mutation({
  args: {
    highlightId: v.id('highlights'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    const highlight = await ctx.db.get(args.highlightId);
    if (!highlight || highlight.userId !== identity.subject) {
      throw new Error('Not found');
    }

    await ctx.db.delete(args.highlightId);
    return true;
  },
});
