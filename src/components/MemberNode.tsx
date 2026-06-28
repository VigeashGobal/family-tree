"use client";

import { useMutation } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import {
  Member,
  RELATIONSHIP_LABELS,
  Relationship,
  RelationshipType,
  relationshipFromPerspective,
} from "@/lib/types";
import { Briefcase, Calendar, Mail, Plus, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type MemberNodeProps = {
  member: Member & { x: number; y: number };
  selected: boolean;
  onSelect: (id: Id<"members">) => void;
};

export function MemberNode({ member, selected, onSelect }: MemberNodeProps) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={() => onSelect(member._id)}
      className={`group absolute w-[180px] text-left transition-all duration-300 ${
        selected ? "z-20" : "z-10"
      }`}
      style={{
        left: member.x - 90,
        top: member.y,
      }}
    >
      <div
        className={`flex flex-col items-center border bg-ivory p-4 transition-all duration-300 ${
          selected
            ? "border-gold shadow-[0_8px_30px_rgba(184,151,106,0.2)]"
            : "border-line hover:border-gold/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full border border-line">
          {member.pictureUrl ? (
            <Image
              src={member.pictureUrl}
              alt={member.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cream">
              <span className="font-serif text-xl text-muted">{initials}</span>
            </div>
          )}
        </div>

        <h3 className="font-serif text-lg font-medium tracking-wide text-black">
          {member.name}
        </h3>

        {member.job && (
          <p className="mt-1 text-center text-[11px] uppercase tracking-wider text-muted">
            {member.job}
          </p>
        )}
      </div>
    </button>
  );
}

type RelatedEntry = {
  relatedId: Id<"members">;
  relatedName: string;
  type: RelationshipType;
};

type MemberDetailProps = {
  member: Member | null;
  members: Member[];
  relationships: RelatedEntry[];
  onClose: () => void;
  onDelete?: (id: Id<"members">) => void;
  onLinkAdded?: () => void;
};

export function MemberDetail({
  member,
  members,
  relationships,
  onClose,
  onDelete,
  onLinkAdded,
}: MemberDetailProps) {
  const addRelationship = useMutation(api.members.addRelationship);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [relatedMemberId, setRelatedMemberId] = useState("");
  const [relationship, setRelationship] = useState<RelationshipType>("child");
  const [linking, setLinking] = useState(false);

  if (!member) return null;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const otherMembers = members.filter((m) => m._id !== member._id);

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!relatedMemberId) return;

    setLinking(true);
    try {
      await addRelationship({
        memberId: member!._id,
        relatedMemberId: relatedMemberId as Id<"members">,
        relationship,
      });
      setRelatedMemberId("");
      setRelationship("child");
      setShowLinkForm(false);
      onLinkAdded?.();
    } finally {
      setLinking(false);
    }
  }

  return (
    <aside className="animate-fade-in fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-ivory shadow-2xl md:w-[400px]">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <h2 className="font-serif text-xl tracking-[0.15em] uppercase">
          Profile
        </h2>
        <button
          onClick={onClose}
          className="text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-black"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="flex flex-col items-center">
          <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-2 border-gold/30">
            {member.pictureUrl ? (
              <Image
                src={member.pictureUrl}
                alt={member.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-cream">
                <span className="font-serif text-3xl text-muted">{initials}</span>
              </div>
            )}
          </div>

          <h3 className="font-serif text-3xl font-light tracking-wide">
            {member.name}
          </h3>
        </div>

        {relationships.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-muted">
              Relationships
            </p>
            <div className="space-y-2">
              {relationships.map((rel) => (
                <div
                  key={`${rel.relatedId}-${rel.type}`}
                  className="border border-line bg-cream/40 px-4 py-3 text-sm"
                >
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gold">
                    {RELATIONSHIP_LABELS[rel.type]}
                  </span>
                  <p className="mt-1 font-serif text-charcoal">
                    {rel.relatedName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherMembers.length > 0 && (
          <div className="mt-6">
            {!showLinkForm ? (
              <button
                onClick={() => setShowLinkForm(true)}
                className="flex w-full items-center justify-center gap-2 border border-line py-3 text-[11px] uppercase tracking-[0.2em] text-charcoal transition-colors hover:border-gold"
              >
                <Plus className="h-3.5 w-3.5" />
                Link to another member
              </button>
            ) : (
              <form onSubmit={handleAddLink} className="border border-line p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted">
                  New connection
                </p>
                <select
                  value={relatedMemberId}
                  onChange={(e) => setRelatedMemberId(e.target.value)}
                  className="field-input mb-2"
                  required
                >
                  <option value="">Select member</option>
                  {otherMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <select
                  value={relationship}
                  onChange={(e) =>
                    setRelationship(e.target.value as RelationshipType)
                  }
                  className="field-input mb-3"
                >
                  {(
                    Object.entries(RELATIONSHIP_LABELS) as [
                      RelationshipType,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={linking}
                    className="flex-1 border border-black bg-black py-2 text-[10px] uppercase tracking-[0.15em] text-ivory disabled:opacity-50"
                  >
                    {linking ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLinkForm(false)}
                    className="flex-1 border border-line py-2 text-[10px] uppercase tracking-[0.15em] text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-10 space-y-5">
          {member.job && (
            <DetailRow icon={Briefcase} label="Occupation" value={member.job} />
          )}
          {member.birthday && (
            <DetailRow
              icon={Calendar}
              label="Birthday"
              value={member.birthday}
            />
          )}
          {member.email && (
            <DetailRow icon={Mail} label="Email" value={member.email} />
          )}
          {!member.job && !member.birthday && !member.email && (
            <DetailRow icon={User} label="Details" value="No additional details" />
          )}
        </div>
      </div>

      {onDelete && (
        <div className="border-t border-line p-6">
          <button
            onClick={() => onDelete(member._id)}
            className="w-full border border-line py-3 text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:border-red-300 hover:text-red-600"
          >
            Remove from tree
          </button>
        </div>
      )}
    </aside>
  );
}

export function buildMemberRelationships(
  memberId: Id<"members">,
  members: Member[],
  relationships: Relationship[],
): RelatedEntry[] {
  const memberMap = new Map(members.map((m) => [m._id, m]));

  return relationships
    .filter((r) => r.fromMemberId === memberId || r.toMemberId === memberId)
    .map((rel) => {
      const { relatedId, type } = relationshipFromPerspective(memberId, rel);
      return {
        relatedId,
        relatedName: memberMap.get(relatedId)?.name ?? "Unknown",
        type,
      };
    });
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-line pb-5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
          {label}
        </p>
        <p className="mt-1 text-sm text-charcoal">{value}</p>
      </div>
    </div>
  );
}
