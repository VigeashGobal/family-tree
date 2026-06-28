"use client";

import { useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { EDGE_LABELS, Member, Relationship } from "@/lib/types";
import {
  areSiblingsConnected,
  buildFamilyUnits,
  isParentChildEdgeCoveredByFamilyUnit,
} from "@/lib/relationships";
import { getParentChildPair, layoutTree, NODE_HEIGHT } from "@/lib/treeLayout";
import { FocusTarget, TreeViewport } from "./TreeViewport";
import { MemberNode } from "./MemberNode";

type FamilyTreeProps = {
  members: Member[];
  relationships: Relationship[];
  selectedId: Id<"members"> | null;
  highlightedId: Id<"members"> | null;
  focusRequest: { id: Id<"members">; token: number } | null;
  onSelect: (id: Id<"members">) => void;
};

type TreeNode = Member & { x: number; y: number };

function EdgeLabel({
  x,
  y,
  label,
  width = 56,
}: {
  x: number;
  y: number;
  label: string;
  width?: number;
}) {
  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - 9}
        width={width}
        height={18}
        fill="#faf8f5"
        stroke="#e8e2d9"
        strokeWidth={0.5}
      />
      <text
        x={x}
        y={y + 4}
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

function renderSpouseOrSiblingEdge(
  edge: { id: string; from: Id<"members">; to: Id<"members">; type: string },
  from: TreeNode,
  to: TreeNode,
) {
  const isSpouse = edge.type === "spouse";
  const label = EDGE_LABELS[edge.type as keyof typeof EDGE_LABELS];
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
        strokeDasharray={isSpouse ? undefined : "4 4"}
      />
      <EdgeLabel x={(from.x + to.x) / 2} y={y - 12} label={label} />
    </g>
  );
}

function renderFamilyUnit(
  unit: ReturnType<typeof buildFamilyUnits>[number],
  nodeMap: Map<Id<"members">, TreeNode>,
) {
  const children = unit.childIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is TreeNode => Boolean(n));
  const parents = unit.parentIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is TreeNode => Boolean(n));

  if (children.length === 0 || parents.length === 0) return null;

  const childBottom = Math.max(...children.map((c) => c.y + NODE_HEIGHT));
  const parentTop = Math.min(...parents.map((p) => p.y));
  const childXs = children.map((c) => c.x);
  const minChildX = Math.min(...childXs);
  const maxChildX = Math.max(...childXs);
  const centerChildX = (minChildX + maxChildX) / 2;

  const siblingBarY = childBottom + 14;
  const branchY = siblingBarY + 28;
  const parentXs = parents.map((p) => p.x);
  const minParentX = Math.min(...parentXs);
  const maxParentX = Math.max(...parentXs);
  const centerParentX = (minParentX + maxParentX) / 2;

  const label = parents.length > 1 ? "Parents" : "Parent";
  const labelX = parents.length > 1 ? centerParentX : parents[0]!.x;

  return (
    <g key={unit.key}>
      {children.map((child) => (
        <line
          key={child._id}
          x1={child.x}
          y1={child.y + NODE_HEIGHT}
          x2={child.x}
          y2={siblingBarY}
          stroke="#b8976a"
          strokeWidth={1}
        />
      ))}

      {children.length > 1 && (
        <line
          x1={minChildX}
          y1={siblingBarY}
          x2={maxChildX}
          y2={siblingBarY}
          stroke="#b8976a"
          strokeWidth={1}
        />
      )}

      <line
        x1={centerChildX}
        y1={siblingBarY}
        x2={centerChildX}
        y2={branchY}
        stroke="#b8976a"
        strokeWidth={1}
      />

      {parents.length > 1 ? (
        <>
          <line
            x1={centerChildX}
            y1={branchY}
            x2={centerParentX}
            y2={branchY}
            stroke="#b8976a"
            strokeWidth={1}
          />
          <line
            x1={minParentX}
            y1={branchY}
            x2={maxParentX}
            y2={branchY}
            stroke="#b8976a"
            strokeWidth={1}
          />
          {parents.map((parent) => (
            <line
              key={parent._id}
              x1={parent.x}
              y1={branchY}
              x2={parent.x}
              y2={parentTop}
              stroke="#b8976a"
              strokeWidth={1}
            />
          ))}
        </>
      ) : (
        <line
          x1={centerChildX}
          y1={branchY}
          x2={parents[0]!.x}
          y2={parentTop}
          stroke="#b8976a"
          strokeWidth={1}
        />
      )}

      <EdgeLabel
        x={labelX}
        y={(branchY + parentTop) / 2}
        label={label}
        width={parents.length > 1 ? 64 : 56}
      />
    </g>
  );
}

export function FamilyTree({
  members,
  relationships,
  selectedId,
  highlightedId,
  focusRequest,
  onSelect,
}: FamilyTreeProps) {
  const { nodes, edges, width, height } = useMemo(
    () => layoutTree(members, relationships),
    [members, relationships],
  );

  const focusTarget = useMemo<FocusTarget | null>(() => {
    if (!focusRequest) return null;
    const node = nodes.find((n) => n._id === focusRequest.id);
    if (!node) return null;
    return { x: node.x, y: node.y, token: focusRequest.token };
  }, [focusRequest, nodes]);

  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n._id, n])),
    [nodes],
  );

  const familyUnits = useMemo(
    () => buildFamilyUnits(members, relationships),
    [members, relationships],
  );

  if (members.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 h-px w-16 bg-gold" />
        <h2 className="font-serif text-2xl font-light tracking-wide text-charcoal md:text-3xl">
          Begin Your Lineage
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Add your first family member to start building an elegant record of
          your heritage.
        </p>
      </div>
    );
  }

  const canvasWidth = Math.max(width, 400);
  const canvasHeight = Math.max(height, 300);

  return (
    <TreeViewport
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      focusTarget={focusTarget}
    >
      <svg
        className="pointer-events-none absolute inset-0"
        width={canvasWidth}
        height={canvasHeight}
        style={{ overflow: "visible" }}
      >
        {familyUnits.map((unit) => renderFamilyUnit(unit, nodeMap))}

        {edges.map((edge) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;

          if (edge.type === "spouse") {
            return renderSpouseOrSiblingEdge(edge, from, to);
          }

          if (edge.type === "sibling") {
            if (areSiblingsConnected(edge.from, edge.to, familyUnits)) {
              return null;
            }
            return renderSpouseOrSiblingEdge(edge, from, to);
          }

          const pair = getParentChildPair(edge);
          if (!pair) return null;

          if (
            isParentChildEdgeCoveredByFamilyUnit(
              pair.child,
              pair.parent,
              familyUnits,
            )
          ) {
            return null;
          }

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
                label={EDGE_LABELS[edge.type]}
              />
            </g>
          );
        })}
      </svg>

      {nodes.map((node) => (
        <MemberNode
          key={node._id}
          member={node}
          selected={selectedId === node._id}
          highlighted={highlightedId === node._id}
          onSelect={onSelect}
        />
      ))}
    </TreeViewport>
  );
}
