import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const relationshipType = v.union(
  v.literal("parent"),
  v.literal("child"),
  v.literal("spouse"),
  v.literal("sibling"),
);

export default defineSchema({
  members: defineTable({
    name: v.string(),
    pictureId: v.optional(v.id("_storage")),
    job: v.optional(v.string()),
    birthday: v.optional(v.string()),
    email: v.optional(v.string()),
  }),
  relationships: defineTable({
    fromMemberId: v.id("members"),
    toMemberId: v.id("members"),
    type: relationshipType,
  })
    .index("by_from", ["fromMemberId"])
    .index("by_to", ["toMemberId"]),
});
