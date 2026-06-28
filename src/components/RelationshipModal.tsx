"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import {
  CONNECT_RELATIONSHIP_OPTIONS,
  describeConnectionPreview,
  SimpleRelationshipRole,
} from "@/lib/relationships";
import { Member } from "@/lib/types";
import { X } from "lucide-react";

export type PendingConnection = {
  fromId: Id<"members">;
  toId: Id<"members">;
};

type RelationshipModalProps = {
  connection: PendingConnection;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
};

export function RelationshipModal({
  connection,
  members,
  onClose,
  onSaved,
}: RelationshipModalProps) {
  const addRelationship = useMutation(api.members.addRelationship);
  const [role, setRole] = useState<SimpleRelationshipRole>("child");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromMember = members.find((m) => m._id === connection.fromId);
  const toMember = members.find((m) => m._id === connection.toId);

  if (!fromMember || !toMember) return null;

  const preview = describeConnectionPreview(fromMember.name, toMember.name, role);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      await addRelationship({
        memberId: connection.fromId,
        relatedMemberId: connection.toId,
        relationship: role,
      });
      onSaved();
      onClose();
    } catch {
      setError("Could not save connection. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-fade-in relative w-full max-w-md border border-line bg-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="font-serif text-xl tracking-[0.15em] uppercase">
              Connect
            </h2>
            <p className="mt-1 text-xs text-muted">
              How are these two people related?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5 flex items-center justify-center gap-3 text-center">
            <span className="font-serif text-lg text-charcoal">
              {fromMember.name}
            </span>
            <span className="text-gold">→</span>
            <span className="font-serif text-lg text-charcoal">
              {toMember.name}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            {CONNECT_RELATIONSHIP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`border px-3 py-3 text-left transition-colors ${
                  role === option.value
                    ? "border-gold bg-cream"
                    : "border-line hover:border-gold/40"
                }`}
              >
                <span className="block text-[11px] uppercase tracking-[0.12em] text-charcoal">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mb-5 border border-gold/30 bg-cream/50 px-3 py-2.5 text-center text-[11px] uppercase tracking-[0.1em] text-gold">
            {preview}
          </p>

          {error && (
            <p className="mb-4 text-center text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 border border-black bg-black py-3 text-[11px] uppercase tracking-[0.2em] text-ivory disabled:opacity-50"
            >
              {saving ? "Saving..." : "Connect"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-line py-3 text-[11px] uppercase tracking-[0.2em] text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
