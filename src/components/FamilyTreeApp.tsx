"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { AddMemberModal } from "@/components/AddMemberModal";
import { FamilyTree } from "@/components/FamilyTree";
import { Header } from "@/components/Header";
import { MemberDetail } from "@/components/MemberNode";
import { RelationshipType } from "@/lib/types";

export function FamilyTreeApp() {
  const data = useQuery(api.members.list);
  const removeMember = useMutation(api.members.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"members"> | null>(null);

  const members = data?.members ?? [];
  const relationships = data?.relationships ?? [];

  const selectedMember = members.find((m) => m._id === selectedId) ?? null;

  const selectedRelation = useMemo(() => {
    if (!selectedId) return null;

    const rel = relationships.find(
      (r) => r.fromMemberId === selectedId || r.toMemberId === selectedId,
    );
    if (!rel) return null;

    const relatedId =
      rel.fromMemberId === selectedId ? rel.toMemberId : rel.fromMemberId;
    const relatedName = members.find((m) => m._id === relatedId)?.name;

    let type: RelationshipType = rel.type;
    if (rel.toMemberId === selectedId) {
      if (rel.type === "parent") type = "child";
      else if (rel.type === "child") type = "parent";
    }

    return { relatedName, type };
  }, [selectedId, relationships, members]);

  if (data === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-px w-12 animate-pulse bg-gold" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
            Loading
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header onAddMember={() => setShowAddModal(true)} />

      <main className="relative flex flex-1 overflow-hidden">
        <FamilyTree
          members={members}
          relationships={relationships}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selectedMember && (
          <MemberDetail
            member={selectedMember}
            relatedName={selectedRelation?.relatedName}
            relationship={selectedRelation?.type}
            onClose={() => setSelectedId(null)}
            onDelete={async (id) => {
              await removeMember({ id });
              setSelectedId(null);
            }}
          />
        )}
      </main>

      {showAddModal && (
        <AddMemberModal
          members={members}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
