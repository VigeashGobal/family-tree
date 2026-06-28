import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  expandLinksWithCouples,
  insertRelationshipIfNew,
} from "./relationshipUtils";
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
    links: v.optional(
      v.array(
        v.object({
          relatedMemberId: v.id("members"),
          relationship: relationshipType,
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const memberId = await ctx.db.insert("members", {
      name: args.name,
      pictureId: args.pictureId,
      job: args.job,
      birthday: args.birthday,
      email: args.email,
    });

    const existingRelationships = await ctx.db.query("relationships").collect();
    const links = expandLinksWithCouples(args.links ?? [], existingRelationships);

    for (const link of links) {
      await insertRelationshipIfNew(
        ctx,
        memberId,
        link.relatedMemberId,
        link.relationship,
      );
    }

    return memberId;
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    name: v.string(),
    job: v.optional(v.string()),
    birthday: v.optional(v.string()),
    email: v.optional(v.string()),
    pictureId: v.optional(v.id("_storage")),
    removePicture: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) {
      throw new Error("Member not found");
    }

    if (args.removePicture && member.pictureId) {
      await ctx.storage.delete(member.pictureId);
    } else if (
      args.pictureId &&
      member.pictureId &&
      member.pictureId !== args.pictureId
    ) {
      await ctx.storage.delete(member.pictureId);
    }

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      job: args.job?.trim() || undefined,
      birthday: args.birthday || undefined,
      email: args.email?.trim() || undefined,
      pictureId: args.removePicture
        ? undefined
        : args.pictureId ?? member.pictureId,
    });
  },
});

export const addRelationship = mutation({
  args: {
    memberId: v.id("members"),
    relatedMemberId: v.id("members"),
    relationship: relationshipType,
  },
  handler: async (ctx, { memberId, relatedMemberId, relationship }) => {
    if (memberId === relatedMemberId) {
      throw new Error("Cannot link a member to themselves");
    }

    const existingRelationships = await ctx.db.query("relationships").collect();
    const links = expandLinksWithCouples(
      [{ relatedMemberId, relationship }],
      existingRelationships,
    );

    const ids = [];
    for (const link of links) {
      const id = await insertRelationshipIfNew(
        ctx,
        memberId,
        link.relatedMemberId,
        link.relationship,
      );
      ids.push(id);
    }

    return ids[0];
  },
});

export const removeRelationship = mutation({
  args: { id: v.id("relationships") },
  handler: async (ctx, { id }) => {
    const relationship = await ctx.db.get(id);
    if (!relationship) return;

    await ctx.db.delete(id);
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
