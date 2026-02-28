import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  highlights: defineTable({
    userId: v.string(),
    documentId: v.string(),
    content: v.string(),
    color: v.string(),
    pageNumber: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_user_document', ['userId', 'documentId'])
});
