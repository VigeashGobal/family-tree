import { Id } from "../../convex/_generated/dataModel";
import { Member, Relationship, TreeEdge, TreeNode } from "./types";

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
    if (rel.type === "parent" && rel.fromMemberId === memberId) {
      parents.push(rel.toMemberId);
    }
    if (rel.type === "child" && rel.toMemberId === memberId) {
      parents.push(rel.fromMemberId);
    }
  }

  return parents;
}

function getSpouse(
  memberId: Id<"members">,
  relationships: Relationship[],
): Id<"members"> | null {
  for (const rel of relationships) {
    if (rel.type !== "spouse") continue;
    if (rel.fromMemberId === memberId) return rel.toMemberId;
    if (rel.toMemberId === memberId) return rel.fromMemberId;
  }
  return null;
}

function assignGenerations(
  members: Member[],
  relationships: Relationship[],
): Map<Id<"members">, number> {
  const generations = new Map<Id<"members">, number>();
  const memberIds = members.map((m) => m._id);

  const roots = memberIds.filter((id) => getParents(id, relationships).length === 0);
  const queue = (roots.length > 0 ? roots : memberIds).map((id) => ({
    id,
    gen: 0,
  }));

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const currentGen = generations.get(id);
    if (currentGen === undefined || gen > currentGen) {
      generations.set(id, gen);
    }

    for (const rel of relationships) {
      if (rel.type === "parent" && rel.fromMemberId === id) {
        queue.push({ id: rel.toMemberId, gen: gen + 1 });
      }
      if (rel.type === "child" && rel.toMemberId === id) {
        queue.push({ id: rel.fromMemberId, gen: gen - 1 });
      }
      if (rel.type === "spouse") {
        const spouseId =
          rel.fromMemberId === id ? rel.toMemberId : rel.fromMemberId;
        if (!visited.has(spouseId)) {
          queue.push({ id: spouseId, gen });
        }
      }
      if (rel.type === "sibling") {
        const siblingId =
          rel.fromMemberId === id ? rel.toMemberId : rel.fromMemberId;
        if (!visited.has(siblingId)) {
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

  const minGen = Math.min(...generations.values());
  for (const [id, gen] of generations) {
    generations.set(id, gen - minGen);
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
    const ordered: Member[] = [];
    const remaining = [...group];

    while (remaining.length > 0) {
      const member = remaining.shift()!;
      ordered.push(member);

      const spouseId = getSpouse(member._id, relationships);
      if (spouseId) {
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

export { NODE_WIDTH, NODE_HEIGHT };
