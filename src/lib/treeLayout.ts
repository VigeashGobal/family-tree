import { Id } from "../../convex/_generated/dataModel";
import { Member, Relationship, RelationshipType, TreeEdge, TreeNode } from "./types";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 220;
const H_GAP = 48;
const V_GAP = 100;

function getParents(
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

function getChildren(
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

function getSpouses(
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

function parseBirthday(birthday?: string): number {
  if (!birthday) return 0;
  const time = new Date(birthday).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function assignGenerations(
  members: Member[],
  relationships: Relationship[],
): Map<Id<"members">, number> {
  const generations = new Map<Id<"members">, number>();
  const memberIds = members.map((m) => m._id);
  const memberMap = new Map(members.map((m) => [m._id, m]));

  const leaves = memberIds.filter(
    (id) => getChildren(id, relationships).length === 0,
  );

  const startIds =
    leaves.length > 0
      ? [...leaves].sort(
          (a, b) =>
            parseBirthday(memberMap.get(b)?.birthday) -
            parseBirthday(memberMap.get(a)?.birthday),
        )
      : [...memberIds].sort(
          (a, b) =>
            parseBirthday(memberMap.get(b)?.birthday) -
            parseBirthday(memberMap.get(a)?.birthday),
        );

  const queue = startIds.map((id) => ({ id, gen: 0 }));

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    const existing = generations.get(id);

    if (existing !== undefined && gen <= existing) continue;
    generations.set(id, gen);

    for (const parentId of getParents(id, relationships)) {
      queue.push({ id: parentId, gen: gen + 1 });
    }

    for (const rel of relationships) {
      if (rel.type === "spouse") {
        const spouseId =
          rel.fromMemberId === id ? rel.toMemberId : rel.fromMemberId;
        if (spouseId !== id) {
          queue.push({ id: spouseId, gen });
        }
      }
      if (rel.type === "sibling") {
        const siblingId =
          rel.fromMemberId === id ? rel.toMemberId : rel.fromMemberId;
        if (siblingId !== id) {
          queue.push({ id: siblingId, gen });
        }
      }
    }
  }

  for (const id of memberIds) {
    if (!generations.has(id)) {
      generations.set(id, 0);
    }
  }

  return generations;
}

export function layoutTree(
  members: Member[],
  relationships: Relationship[],
): { nodes: TreeNode[]; edges: TreeEdge[]; width: number; height: number } {
  if (members.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const generations = assignGenerations(members, relationships);
  const memberMap = new Map(members.map((m) => [m._id, m]));
  const byGeneration = new Map<number, Member[]>();

  for (const member of members) {
    const gen = generations.get(member._id) ?? 0;
    const group = byGeneration.get(gen) ?? [];
    group.push(member);
    byGeneration.set(gen, group);
  }

  const positioned = new Map<Id<"members">, { x: number; y: number }>();
  const placed = new Set<string>();
  let maxGen = 0;

  for (const [gen, group] of [...byGeneration.entries()].sort(
    (a, b) => a[0] - b[0],
  )) {
    maxGen = Math.max(maxGen, gen);

    const sorted = [...group].sort(
      (a, b) => parseBirthday(b.birthday) - parseBirthday(a.birthday),
    );

    const ordered: Member[] = [];
    const remaining = [...sorted];

    while (remaining.length > 0) {
      const member = remaining.shift()!;
      ordered.push(member);

      for (const spouseId of getSpouses(member._id, relationships)) {
        const spouseIdx = remaining.findIndex((m) => m._id === spouseId);
        if (spouseIdx >= 0) {
          ordered.push(remaining.splice(spouseIdx, 1)[0]);
        }
      }
    }

    const rowWidth =
      ordered.length * NODE_WIDTH + (ordered.length - 1) * H_GAP;
    let x = -rowWidth / 2 + NODE_WIDTH / 2;

    for (const member of ordered) {
      if (placed.has(member._id)) continue;
      positioned.set(member._id, { x, y: gen * (NODE_HEIGHT + V_GAP) });
      placed.add(member._id);
      x += NODE_WIDTH + H_GAP;
    }
  }

  for (const member of members) {
    if (!positioned.has(member._id)) {
      positioned.set(member._id, { x: 0, y: maxGen * (NODE_HEIGHT + V_GAP) });
    }
  }

  const nodes: TreeNode[] = members.map((member) => {
    const pos = positioned.get(member._id)!;
    return { ...member, x: pos.x, y: pos.y };
  });

  const edges: TreeEdge[] = relationships.map((rel) => ({
    id: rel._id,
    from: rel.fromMemberId,
    to: rel.toMemberId,
    type: rel.type,
  }));

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0) - NODE_WIDTH / 2 - 40;
  const maxX = Math.max(...xs, 0) + NODE_WIDTH / 2 + 40;
  const maxY = Math.max(...ys, 0) + NODE_HEIGHT + 40;

  const normalizedNodes = nodes.map((n) => ({
    ...n,
    x: n.x - minX,
    y: n.y + 40,
  }));

  return {
    nodes: normalizedNodes,
    edges,
    width: maxX - minX,
    height: maxY + 40,
  };
}

export function getParentChildPair(
  edge: TreeEdge,
): { child: Id<"members">; parent: Id<"members"> } | null {
  if (edge.type === "parent") {
    return { parent: edge.from, child: edge.to };
  }
  if (edge.type === "child") {
    return { parent: edge.to, child: edge.from };
  }
  return null;
}

export { NODE_WIDTH, NODE_HEIGHT };
