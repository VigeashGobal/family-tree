import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { relationshipType } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("members").collect();
    const relationships = await ctx.db.query("relationships").collect();

    const membersWithPictures = await Promise.all(
      members.map(async (member) => ({
        ...member,
        pictureUrl: member.pictureId
          ? await ctx.storage.getUrl(member.pictureId)
          : null,
      })),
    );

    return { members: membersWithPictures, relationships };
  },
});

export const get = query({
  args: { id: v.id("members") },
  handler: async (ctx, { id }) => {
    const member = await ctx.db.get(id);
    if (!member) return null;

    const pictureUrl = member.pictureId
      ? await ctx.storage.getUrl(member.pictureId)
      : null;

    const relationships = await ctx.db
      .query("relationships")
      .filter((q) =>
        q.or(
          q.eq(q.field("fromMemberId"), id),
          q.eq(q.field("toMemberId"), id),
        ),
      )
      .collect();

    return { ...member, pictureUrl, relationships };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    pictureId: v.optional(v.id("_storage")),
    job: v.optional(v.string()),
    birthday: v.optional(v.string()),
    email: v.optional(v.string()),
    relatedMemberId: v.optional(v.id("members")),
    relationship: v.optional(relationshipType),
  },
  handler: async (ctx, args) => {
    const memberId = await ctx.db.insert("members", {
      name: args.name,
      pictureId: args.pictureId,
      job: args.job,
      birthday: args.birthday,
      email: args.email,
    });

    if (args.relatedMemberId && args.relationship) {
      await ctx.db.insert("relationships", {
        fromMemberId: memberId,
        toMemberId: args.relatedMemberId,
        type: args.relationship,
      });
    }

    return memberId;
  },
});

export const remove = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, { id }) => {
    const member = await ctx.db.get(id);
    if (!member) return;

    const relationships = await ctx.db
      .query("relationships")
      .filter((q) =>
        q.or(
          q.eq(q.field("fromMemberId"), id),
          q.eq(q.field("toMemberId"), id),
        ),
      )
      .collect();

    for (const rel of relationships) {
      await ctx.db.delete(rel._id);
    }

    if (member.pictureId) {
      await ctx.storage.delete(member.pictureId);
    }

    await ctx.db.delete(id);
  },
});
