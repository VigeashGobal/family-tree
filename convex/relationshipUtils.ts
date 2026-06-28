import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

type RelationshipRecord = {
  fromMemberId: Id<"members">;
  toMemberId: Id<"members">;
  type: "parent" | "child" | "spouse" | "sibling";
};

type MemberLink = {
  relatedMemberId: Id<"members">;
  relationship: "parent" | "child" | "spouse" | "sibling";
};

function getSpouses(
  memberId: Id<"members">,
  relationships: RelationshipRecord[],
): Id<"members">[] {
  const spouses: Id<"members">[] = [];

  for (const rel of relationships) {
    if (rel.type !== "spouse") continue;
    if (rel.fromMemberId === memberId) spouses.push(rel.toMemberId);
    if (rel.toMemberId === memberId) spouses.push(rel.fromMemberId);
  }

  return spouses;
}

export function expandLinksWithCouples(
  links: MemberLink[],
  relationships: RelationshipRecord[],
): MemberLink[] {
  const expanded: MemberLink[] = [];
  const seen = new Set<string>();

  function addLink(link: MemberLink) {
    const key = `${link.relationship}:${link.relatedMemberId}`;
    if (seen.has(key)) return;
    seen.add(key);
    expanded.push(link);
  }

  for (const link of links) {
    addLink(link);

    if (link.relationship === "child") {
      for (const spouseId of getSpouses(link.relatedMemberId, relationships)) {
        addLink({ relatedMemberId: spouseId, relationship: "child" });
      }
    }

    if (link.relationship === "parent") {
      for (const spouseId of getSpouses(link.relatedMemberId, relationships)) {
        addLink({ relatedMemberId: spouseId, relationship: "parent" });
      }
    }
  }

  return expanded;
}

export async function insertRelationshipIfNew(
  ctx: MutationCtx,
  fromMemberId: Id<"members">,
  toMemberId: Id<"members">,
  type: "parent" | "child" | "spouse" | "sibling",
) {
  const existing = await ctx.db
    .query("relationships")
    .filter((q) =>
      q.and(
        q.eq(q.field("fromMemberId"), fromMemberId),
        q.eq(q.field("toMemberId"), toMemberId),
        q.eq(q.field("type"), type),
      ),
    )
    .first();

  if (existing) return existing._id;

  return await ctx.db.insert("relationships", {
    fromMemberId,
    toMemberId,
    type,
  });
}
