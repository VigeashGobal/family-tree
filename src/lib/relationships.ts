import { Id } from "../../convex/_generated/dataModel";
import { Member, Relationship, RelationshipType, relationshipFromPerspective } from "./types";

export type SimpleRelationshipRole = "child" | "parent" | "spouse" | "sibling";

export const CONNECT_RELATIONSHIP_OPTIONS: {
  value: SimpleRelationshipRole;
  label: string;
}[] = [
  { value: "child", label: "Child of" },
  { value: "parent", label: "Parent of" },
  { value: "spouse", label: "Spouse of" },
  { value: "sibling", label: "Sibling of" },
];

export function describeConnectionPreview(
  fromName: string,
  toName: string,
  role: SimpleRelationshipRole,
): string {
  switch (role) {
    case "child":
      return `${fromName} is a child of ${toName}`;
    case "parent":
      return `${fromName} is a parent of ${toName}`;
    case "spouse":
      return `${fromName} is the spouse of ${toName}`;
    case "sibling":
      return `${fromName} is a sibling of ${toName}`;
  }
}

export const SIMPLE_RELATIONSHIP_OPTIONS: {
  value: SimpleRelationshipRole;
  label: string;
  description: string;
}[] = [
  {
    value: "child",
    label: "Child of",
    description: "Add as a son or daughter (links to both parents if they're married)",
  },
  {
    value: "parent",
    label: "Parent of",
    description: "Add as a mother or father",
  },
  {
    value: "spouse",
    label: "Spouse of",
    description: "Add as a husband or wife",
  },
  {
    value: "sibling",
    label: "Sibling of",
    description: "Add as a brother or sister",
  },
];

export type MemberLink = {
  relatedMemberId: Id<"members">;
  relationship: RelationshipType;
};

export function getSpouses(
  memberId: Id<"members">,
  relationships: Relationship[],
): Id<"members">[] {
  const spouses: Id<"members">[] = [];

  for (const rel of relationships) {
    if (rel.type !== "spouse") continue;
    if (rel.fromMemberId === memberId) spouses.push(rel.toMemberId);
    if (rel.toMemberId === memberId) spouses.push(rel.fromMemberId);
  }

  return spouses;
}

export function getParents(
  memberId: Id<"members">,
  relationships: Relationship[],
): Id<"members">[] {
  const parents: Id<"members">[] = [];

  for (const rel of relationships) {
    if (rel.type === "child" && rel.fromMemberId === memberId) {
      parents.push(rel.toMemberId);
    }
    if (rel.type === "parent" && rel.toMemberId === memberId) {
      parents.push(rel.fromMemberId);
    }
  }

  return parents;
}

export function getChildren(
  memberId: Id<"members">,
  relationships: Relationship[],
): Id<"members">[] {
  const children: Id<"members">[] = [];

  for (const rel of relationships) {
    if (rel.type === "parent" && rel.fromMemberId === memberId) {
      children.push(rel.toMemberId);
    }
    if (rel.type === "child" && rel.toMemberId === memberId) {
      children.push(rel.fromMemberId);
    }
  }

  return children;
}

export function areSpouses(
  a: Id<"members">,
  b: Id<"members">,
  relationships: Relationship[],
): boolean {
  return getSpouses(a, relationships).includes(b);
}

/** Parents on record plus spouses of those parents (married couple as one unit). */
export function getEffectiveParents(
  childId: Id<"members">,
  relationships: Relationship[],
): Id<"members">[] {
  const parents = new Set(getParents(childId, relationships));

  for (const parent of [...parents]) {
    for (const spouse of getSpouses(parent, relationships)) {
      parents.add(spouse);
    }
  }

  return [...parents].sort();
}

export function parentSetKey(parentIds: Id<"members">[]): string {
  return [...parentIds].sort().join("|");
}

export type FamilyUnit = {
  key: string;
  parentIds: Id<"members">[];
  childIds: Id<"members">[];
};

export function buildFamilyUnits(
  members: Member[],
  relationships: Relationship[],
): FamilyUnit[] {
  const groups = new Map<string, FamilyUnit>();

  for (const member of members) {
    const parentIds = getEffectiveParents(member._id, relationships);
    if (parentIds.length === 0) continue;

    const key = parentSetKey(parentIds);
    const existing = groups.get(key);

    if (existing) {
      if (!existing.childIds.includes(member._id)) {
        existing.childIds.push(member._id);
      }
    } else {
      groups.set(key, { key, parentIds, childIds: [member._id] });
    }
  }

  return [...groups.values()];
}

export function expandLinksWithCouples(
  memberId: Id<"members">,
  links: MemberLink[],
  relationships: Relationship[],
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
  }

  return expanded;
}

export function describeLinkPreviewWithMembers(
  role: SimpleRelationshipRole,
  relatedMember: Member | undefined,
  members: Member[],
  relationships: Relationship[],
): string | null {
  if (!relatedMember) return null;

  const memberMap = new Map(members.map((m) => [m._id, m]));

  if (role === "child") {
    const spouses = getSpouses(relatedMember._id, relationships);
    if (spouses.length > 0) {
      const names = [
        relatedMember.name,
        ...spouses.map((id) => memberMap.get(id)?.name ?? "spouse"),
      ];
      return `Child of ${names.join(" & ")}`;
    }
    return `Child of ${relatedMember.name}`;
  }

  if (role === "parent") {
    return `Parent of ${relatedMember.name}`;
  }

  if (role === "spouse") {
    return `Spouse of ${relatedMember.name}`;
  }

  return `Sibling of ${relatedMember.name}`;
}

export function isParentChildEdgeCoveredByFamilyUnit(
  childId: Id<"members">,
  parentId: Id<"members">,
  units: FamilyUnit[],
): boolean {
  return units.some(
    (unit) =>
      unit.childIds.includes(childId) && unit.parentIds.includes(parentId),
  );
}

export function areSiblingsConnected(
  a: Id<"members">,
  b: Id<"members">,
  units: FamilyUnit[],
): boolean {
  return units.some(
    (unit) => unit.childIds.includes(a) && unit.childIds.includes(b),
  );
}

export type DisplayRelationship = {
  relationshipId?: Id<"relationships">;
  relatedId?: Id<"members">;
  relatedName: string;
  type: RelationshipType;
};

export function buildDisplayRelationships(
  memberId: Id<"members">,
  members: Member[],
  relationships: Relationship[],
): DisplayRelationship[] {
  const memberMap = new Map(members.map((m) => [m._id, m]));
  const raw = relationships
    .filter((r) => r.fromMemberId === memberId || r.toMemberId === memberId)
    .map((rel) => {
      const { relatedId, type } = relationshipFromPerspective(memberId, rel);
      return {
        relationshipId: rel._id,
        relatedId,
        relatedName: memberMap.get(relatedId)?.name ?? "Unknown",
        type,
      };
    });

  const display: DisplayRelationship[] = [];
  const usedParentIds = new Set<string>();

  for (const entry of raw) {
    if (entry.type !== "child") {
      display.push(entry);
      continue;
    }

    const parentId = entry.relatedId!;
    if (usedParentIds.has(parentId)) continue;

    const spouseIds = getSpouses(parentId, relationships).filter((spouseId) =>
      raw.some((r) => r.type === "child" && r.relatedId === spouseId),
    );

    if (spouseIds.length > 0) {
      usedParentIds.add(parentId);
      for (const spouseId of spouseIds) usedParentIds.add(spouseId);

      const names = [
        entry.relatedName,
        ...spouseIds.map((id) => memberMap.get(id)?.name ?? "Unknown"),
      ];
      display.push({
        relatedName: names.join(" & "),
        type: "child",
      });
    } else {
      usedParentIds.add(parentId);
      display.push(entry);
    }
  }

  return display;
}
