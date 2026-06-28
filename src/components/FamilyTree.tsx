"use client";

import { useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { EDGE_LABELS, Member, Relationship } from "@/lib/types";
import {
  getParentChildPair,
  layoutTree,
  NODE_HEIGHT,
} from "@/lib/treeLayout";
import { MemberNode } from "./MemberNode";

type FamilyTreeProps = {
  members: Member[];
  relationships: Relationship[];
  selectedId: Id<"members"> | null;
  onSelect: (id: Id<"members">) => void;
};

type TreeNode = Member & { x: number; y: number };

function EdgeLabel({
  x,
  y,
  label,
  variant,
}: {
  x: number;
  y: number;
  label: string;
  variant: "horizontal" | "vertical";
}) {
  return (
    <g>
      <rect
        x={x - 28}
        y={y - 9}
        width={56}
        height={18}
        fill="#faf8f5"
        stroke="#e8e2d9"
        strokeWidth={0.5}
      />
      <text
        x={x}
        y={y + (variant === "horizontal" ? 4 : 3)}
        textAnchor="middle"
        className="fill-charcoal"
        style={{
          fontSize: "9px",
          fontFamily: "var(--font-sans), sans-serif",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </text>
    </g>
  );
}

function renderEdge(
  edge: { id: string; from: Id<"members">; to: Id<"members">; type: string },
  from: TreeNode,
  to: TreeNode,
) {
  const isSpouse = edge.type === "spouse";
  const isSibling = edge.type === "sibling";
  const label = EDGE_LABELS[edge.type as keyof typeof EDGE_LABELS];

  if (isSpouse || isSibling) {
    const sameRow = Math.abs(from.y - to.y) < 20;
    const y = sameRow
      ? from.y + NODE_HEIGHT / 2
      : (from.y + to.y + NODE_HEIGHT) / 2;

    return (
      <g key={edge.id}>
        <line
          x1={from.x}
          y1={y}
          x2={to.x}
          y2={y}
          stroke={isSpouse ? "#b8976a" : "#d4bc94"}
          strokeWidth={isSpouse ? 1.5 : 1}
          strokeDasharray={isSibling ? "4 4" : undefined}
        />
        <EdgeLabel
          x={(from.x + to.x) / 2}
          y={y - 12}
          label={label}
          variant="horizontal"
        />
      </g>
    );
  }

  const pair = getParentChildPair({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    type: edge.type as "parent" | "child",
  });
  if (!pair) return null;

  const childNode = from._id === pair.child ? from : to;
  const parentNode = from._id === pair.parent ? from : to;

  const cx = childNode.x;
  const cy = childNode.y + NODE_HEIGHT;
  const px = parentNode.x;
  const py = parentNode.y;
  const midY = (cy + py) / 2;

  return (
    <g key={edge.id}>
      <path
        d={`M ${cx} ${cy} L ${cx} ${midY} L ${px} ${midY} L ${px} ${py}`}
        fill="none"
        stroke="#b8976a"
        strokeWidth={1}
      />
      <EdgeLabel
        x={(cx + px) / 2}
        y={midY}
        label={label}
        variant="horizontal"
      />
    </g>
  );
}

export function FamilyTree({
  members,
  relationships,
  selectedId,
  onSelect,
}: FamilyTreeProps) {
  const { nodes, edges, width, height } = useMemo(
    () => layoutTree(members, relationships),
    [members, relationships],
  );

  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n._id, n])),
    [nodes],
  );

  if (members.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 h-px w-16 bg-gold" />
        <h2 className="font-serif text-3xl font-light tracking-wide text-charcoal">
          Begin Your Lineage
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Add your first family member to start building an elegant record of
          your heritage.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 md:p-10">
      <div
        className="relative mx-auto"
        style={{
          width: Math.max(width, 400),
          height: Math.max(height, 300),
          minHeight: 400,
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={width}
          height={height}
          style={{ overflow: "visible" }}
        >
          {edges.map((edge) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            return renderEdge(edge, from, to);
          })}
        </svg>

        {nodes.map((node) => (
          <MemberNode
            key={node._id}
            member={node}
            selected={selectedId === node._id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
