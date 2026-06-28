"use client";

import { Id } from "../../convex/_generated/dataModel";
import { Member, RelationshipType } from "@/lib/types";
import { Briefcase, Calendar, Mail, User } from "lucide-react";
import Image from "next/image";

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

type MemberDetailProps = {
  member: Member | null;
  relatedName?: string;
  relationship?: RelationshipType;
  onClose: () => void;
  onDelete?: (id: Id<"members">) => void;
};

export function MemberDetail({
  member,
  relatedName,
  relationship,
  onClose,
  onDelete,
}: MemberDetailProps) {
  if (!member) return null;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

          {relatedName && relationship && (
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-gold">
              {relationship === "parent" && `Parent of ${relatedName}`}
              {relationship === "child" && `Child of ${relatedName}`}
              {relationship === "spouse" && `Spouse of ${relatedName}`}
              {relationship === "sibling" && `Sibling of ${relatedName}`}
            </p>
          )}
        </div>

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
