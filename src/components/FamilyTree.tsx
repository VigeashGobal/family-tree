"use client";

import { useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Member, Relationship } from "@/lib/types";
import { layoutTree, NODE_HEIGHT } from "@/lib/treeLayout";
import { MemberNode } from "./MemberNode";

type FamilyTreeProps = {
  members: Member[];
  relationships: Relationship[];
  selectedId: Id<"members"> | null;
  onSelect: (id: Id<"members">) => void;
};

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
          {edges.map((edge, i) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;

            const isSpouse = edge.type === "spouse";
            const isSibling = edge.type === "sibling";

            const x1 = from.x;
            const y1 = from.y + NODE_HEIGHT / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_HEIGHT / 2;

            if (isSpouse || isSibling) {
              const midY = (y1 + y2) / 2;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={midY}
                  x2={x2}
                  y2={midY}
                  stroke={isSpouse ? "#b8976a" : "#e8e2d9"}
                  strokeWidth={isSpouse ? 1.5 : 1}
                  strokeDasharray={isSibling ? "4 4" : undefined}
                />
              );
            }

            const isParentChild =
              edge.type === "parent" || edge.type === "child";

            if (!isParentChild) return null;

            const parent = edge.type === "parent" ? from : to;
            const child = edge.type === "parent" ? to : from;
            const px = parent.x;
            const py = parent.y + NODE_HEIGHT;
            const cx = child.x;
            const cy = child.y;
            const midY = (py + cy) / 2;

            return (
              <path
                key={i}
                d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
                fill="none"
                stroke="#d4bc94"
                strokeWidth={1}
              />
            );
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
