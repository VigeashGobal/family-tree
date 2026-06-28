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
import {
  PendingConnection,
  RelationshipModal,
} from "@/components/RelationshipModal";

export function FamilyTreeApp() {
  const data = useQuery(api.members.list);
  const removeMember = useMutation(api.members.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"members"> | null>(null);
  const [highlightedId, setHighlightedId] = useState<Id<"members"> | null>(
    null,
  );
  const [focusRequest, setFocusRequest] = useState<{
    id: Id<"members">;
    token: number;
  } | null>(null);
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);

  const members = data?.members ?? [];
  const relationships = data?.relationships ?? [];

  const selectedMember = members.find((m) => m._id === selectedId) ?? null;

  const selectedRelationships = useMemo(() => {
    if (!selectedId) return [];
    return buildMemberRelationships(selectedId, members, relationships);
  }, [selectedId, members, relationships]);

  function handleSearchSelect(id: Id<"members">) {
    setSelectedId(id);
    setHighlightedId(id);
    setFocusRequest({ id, token: Date.now() });
    setTimeout(() => setHighlightedId(null), 2500);
  }

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
    <div className="flex h-full min-h-0 flex-col">
      <Header
        members={members}
        onAddMember={() => setShowAddModal(true)}
        onSearchSelect={handleSearchSelect}
      />

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <FamilyTree
          members={members}
          relationships={relationships}
          selectedId={selectedId}
          highlightedId={highlightedId}
          focusRequest={focusRequest}
          onSelect={(id) => {
            setSelectedId(id);
            setHighlightedId(null);
          }}
          onPendingConnection={setPendingConnection}
        />

        {selectedMember && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              onClick={() => setSelectedId(null)}
              aria-hidden
            />
            <MemberDetail
              member={selectedMember}
              members={members}
              relationships={selectedRelationships}
              onClose={() => setSelectedId(null)}
              onDelete={async (id) => {
                await removeMember({ id });
                setSelectedId(null);
              }}
            />
          </>
        )}
      </main>

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onCreated={(id) => {
            setSelectedId(id);
            setFocusRequest({ id, token: Date.now() });
          }}
        />
      )}

      {pendingConnection && (
        <RelationshipModal
          connection={pendingConnection}
          members={members}
          onClose={() => setPendingConnection(null)}
          onSaved={() => setPendingConnection(null)}
        />
      )}
    </div>
  );
}
