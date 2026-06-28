import { Id } from "../../convex/_generated/dataModel";
import { Member, Relationship, TreeEdge, TreeNode } from "./types";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 220;
const H_GAP = 48;
const V_GAP = 100;

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

function getParentChildPairs(
  relationships: Relationship[],
): { child: Id<"members">; parent: Id<"members"> }[] {
  const pairs: { child: Id<"members">; parent: Id<"members"> }[] = [];

  for (const rel of relationships) {
    if (rel.type === "child") {
      pairs.push({ child: rel.fromMemberId, parent: rel.toMemberId });
    } else if (rel.type === "parent") {
      pairs.push({ child: rel.toMemberId, parent: rel.fromMemberId });
    }
  }

  return pairs;
}

function assignGenerations(
  members: Member[],
  relationships: Relationship[],
): Map<Id<"members">, number> {
  const generations = new Map<Id<"members">, number>();

  for (const member of members) {
    generations.set(member._id, 0);
  }

  const parentChildPairs = getParentChildPairs(relationships);
  const maxIterations = members.length + 5;
  let changed = true;
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations += 1;

    for (const { child, parent } of parentChildPairs) {
      const childGen = generations.get(child) ?? 0;
      const parentGen = generations.get(parent) ?? 0;
      const nextParentGen = childGen + 1;

      if (nextParentGen > parentGen) {
        generations.set(parent, nextParentGen);
        changed = true;
      }
    }

    for (const rel of relationships) {
      if (rel.type !== "spouse" && rel.type !== "sibling") continue;

      const a = rel.fromMemberId;
      const b = rel.toMemberId;
      const aligned = Math.max(generations.get(a) ?? 0, generations.get(b) ?? 0);

      if (aligned > (generations.get(a) ?? 0)) {
        generations.set(a, aligned);
        changed = true;
      }
      if (aligned > (generations.get(b) ?? 0)) {
        generations.set(b, aligned);
        changed = true;
      }
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
