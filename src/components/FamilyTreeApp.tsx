"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { AddMemberModal } from "@/components/AddMemberModal";
import { FamilyTree } from "@/components/FamilyTree";
import { Header } from "@/components/Header";
import {
  buildMemberRelationships,
  MemberDetail,
} from "@/components/MemberNode";

export function FamilyTreeApp() {
  const data = useQuery(api.members.list);
  const removeMember = useMutation(api.members.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"members"> | null>(null);

  const members = data?.members ?? [];
  const relationships = data?.relationships ?? [];

  const selectedMember = members.find((m) => m._id === selectedId) ?? null;

  const selectedRelationships = useMemo(() => {
    if (!selectedId) return [];
    return buildMemberRelationships(selectedId, members, relationships);
  }, [selectedId, members, relationships]);

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
            members={members}
            relationships={selectedRelationships}
            allRelationships={relationships}
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
          relationships={relationships}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
