import { Id } from "../../convex/_generated/dataModel";

export type RelationshipType = "parent" | "child" | "spouse" | "sibling";

export type Member = {
  _id: Id<"members">;
  name: string;
  pictureUrl: string | null;
  job?: string;
  birthday?: string;
  email?: string;
};

export type Relationship = {
  _id: Id<"relationships">;
  fromMemberId: Id<"members">;
  toMemberId: Id<"members">;
  type: RelationshipType;
};

export type TreeNode = Member & {
  x: number;
  y: number;
};

export type TreeEdge = {
  id: string;
  from: Id<"members">;
  to: Id<"members">;
  type: RelationshipType;
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  parent: "Parent of",
  child: "Child of",
  spouse: "Spouse of",
  sibling: "Sibling of",
};

export const EDGE_LABELS: Record<RelationshipType, string> = {
  parent: "Parent",
  child: "Child",
  spouse: "Spouse",
  sibling: "Sibling",
};

export function relationshipFromPerspective(
  memberId: Id<"members">,
  rel: Relationship,
): { relatedId: Id<"members">; type: RelationshipType } {
  const relatedId =
    rel.fromMemberId === memberId ? rel.toMemberId : rel.fromMemberId;

  if (rel.fromMemberId === memberId) {
    return { relatedId, type: rel.type };
  }

  let type: RelationshipType = rel.type;
  if (rel.type === "parent") type = "child";
  else if (rel.type === "child") type = "parent";

  return { relatedId, type };
}
