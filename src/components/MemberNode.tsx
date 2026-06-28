"use client";

import { useMutation } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { buildDisplayRelationships } from "@/lib/relationships";
import { Member, Relationship, RELATIONSHIP_LABELS } from "@/lib/types";
import { Briefcase, Calendar, Link2, Mail, Pencil, Upload, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { GenericId } from "convex/values";
import { NODE_WIDTH } from "@/lib/treeLayout";

type MemberNodeProps = {
  member: Member & { x: number; y: number };
  selected: boolean;
  highlighted?: boolean;
  connectSourceId?: Id<"members"> | null;
  isConnectTarget?: boolean;
  isConnectingFrom?: boolean;
  onSelect: (id: Id<"members">) => void;
  onConnectionStart: (id: Id<"members">, e: React.PointerEvent) => void;
  onConnectHandleTap: (id: Id<"members">) => void;
};

export function MemberNode({
  member,
  selected,
  highlighted,
  connectSourceId,
  isConnectTarget,
  isConnectingFrom,
  onSelect,
  onConnectionStart,
  onConnectHandleTap,
}: MemberNodeProps) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const canAcceptConnection =
    Boolean(connectSourceId) && connectSourceId !== member._id;

  return (
    <div
      data-member-id={member._id}
      className={`group absolute w-[148px] sm:w-[168px] md:w-[180px] ${
        selected ? "z-20" : highlighted || isConnectTarget ? "z-20" : "z-10"
      }`}
      style={{
        left: member.x - NODE_WIDTH / 2,
        top: member.y,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(member._id)}
        className={`w-full text-left transition-all duration-300 ${
          canAcceptConnection ? "ring-2 ring-gold/40 ring-offset-2 ring-offset-ivory" : ""
        }`}
      >
        <div
          className={`flex flex-col items-center border bg-ivory p-3 transition-all duration-300 md:p-4 ${
            selected
              ? "border-gold shadow-[0_8px_30px_rgba(184,151,106,0.2)]"
              : highlighted
                ? "search-highlight border-gold shadow-[0_8px_30px_rgba(184,151,106,0.35)]"
                : isConnectTarget
                  ? "border-gold bg-cream/60 shadow-[0_8px_30px_rgba(184,151,106,0.25)]"
                  : "border-line hover:border-gold/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          }`}
        >
        <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border border-line md:mb-3 md:h-20 md:w-20">
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

      <button
        type="button"
        data-connection-handle
        aria-label={`Connect ${member.name} to someone else`}
        onPointerDown={(e) => {
          e.stopPropagation();
          onConnectionStart(member._id, e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onConnectHandleTap(member._id);
        }}
        className={`absolute -bottom-1.5 left-1/2 z-30 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-ivory transition-all hover:scale-110 ${
          isConnectingFrom
            ? "connect-pulse border-gold bg-gold/20"
            : "border-gold/60 hover:border-gold hover:bg-cream"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      </button>
    </div>
  );
}

type RelatedEntry = {
  relatedId?: Id<"members">;
  relatedName: string;
  type: import("@/lib/types").RelationshipType;
};

type MemberDetailProps = {
  member: Member | null;
  members: Member[];
  relationships: RelatedEntry[];
  onClose: () => void;
  onDelete?: (id: Id<"members">) => void;
};

export function MemberDetail({
  member,
  members,
  relationships,
  onClose,
  onDelete,
}: MemberDetailProps) {
  const updateMember = useMutation(api.members.update);
  const generateUploadUrl = useMutation(api.members.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!member) return;
    setName(member.name);
    setJob(member.job ?? "");
    setBirthday(member.birthday ?? "");
    setEmail(member.email ?? "");
    setPreviewUrl(null);
    setPictureFile(null);
    setRemovePicture(false);
    setIsEditing(false);
    setEditError(null);
  }, [member?._id, member?.name, member?.job, member?.birthday, member?.email]);

  if (!member) return null;

  const profile = member;
  const memberId = profile._id;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setEditError("Name is required");
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      let pictureId: GenericId<"_storage"> | undefined;

      if (pictureFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": pictureFile.type },
          body: pictureFile,
        });
        const { storageId } = await result.json();
        pictureId = storageId;
      }

      await updateMember({
        id: memberId,
        name: name.trim(),
        job: job.trim() || undefined,
        birthday: birthday || undefined,
        email: email.trim() || undefined,
        pictureId,
        removePicture: removePicture && !pictureFile,
      });

      setIsEditing(false);
      setPreviewUrl(null);
      setPictureFile(null);
      setRemovePicture(false);
    } catch {
      setEditError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setName(profile.name);
    setJob(profile.job ?? "");
    setBirthday(profile.birthday ?? "");
    setEmail(profile.email ?? "");
    setPreviewUrl(null);
    setPictureFile(null);
    setRemovePicture(false);
    setEditError(null);
    setIsEditing(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPictureFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemovePicture(false);
  }

  const displayPictureUrl =
    previewUrl ?? (removePicture ? null : profile.pictureUrl);

  return (
    <aside className="animate-fade-in fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] w-full flex-col rounded-t-2xl border-t border-line bg-ivory shadow-2xl md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-full md:max-w-md md:rounded-none md:border-l md:border-t-0 md:w-[400px]">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <h2 className="font-serif text-xl tracking-[0.15em] uppercase">
          {isEditing ? "Edit Profile" : "Profile"}
        </h2>
        <div className="flex items-center gap-4">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-black"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-black"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {isEditing ? (
          <form onSubmit={handleSaveEdit}>
            <div className="mb-6 flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-gold/30 bg-cream transition-colors hover:border-gold"
              >
                {displayPictureUrl ? (
                  <Image
                    src={displayPictureUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted">
                    <Upload className="mb-1 h-6 w-6" />
                    <span className="text-[9px] uppercase tracking-wider">
                      Photo
                    </span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {(profile.pictureUrl || previewUrl) && !removePicture && (
                <button
                  type="button"
                  onClick={() => {
                    setRemovePicture(true);
                    setPreviewUrl(null);
                    setPictureFile(null);
                  }}
                  className="mt-2 text-[10px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-red-500"
                >
                  Remove photo
                </button>
              )}
            </div>

            <EditField label="Full Name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
              />
            </EditField>

            <EditField label="Occupation">
              <input
                value={job}
                onChange={(e) => setJob(e.target.value)}
                className="field-input"
              />
            </EditField>

            <div className="grid grid-cols-2 gap-4">
              <EditField label="Birthday">
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="field-input"
                />
              </EditField>
              <EditField label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                />
              </EditField>
            </div>

            {editError && (
              <p className="mt-4 text-center text-sm text-red-600">{editError}</p>
            )}

            <div className="mt-6 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 border border-black bg-black py-3 text-[11px] uppercase tracking-[0.2em] text-ivory disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 border border-line py-3 text-[11px] uppercase tracking-[0.2em] text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
        <div className="flex flex-col items-center">
          <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-2 border-gold/30">
            {profile.pictureUrl ? (
              <Image
                src={profile.pictureUrl}
                alt={profile.name}
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
            {profile.name}
          </h3>
        </div>

        {relationships.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-muted">
              Relationships
            </p>
            <div className="space-y-2">
              {relationships.map((rel, index) => (
                <div
                  key={`${rel.type}-${rel.relatedName}-${index}`}
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

        {members.length > 1 && (
          <div className="mt-6 flex items-start gap-3 border border-line bg-cream/30 px-4 py-3">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="text-[11px] leading-relaxed text-muted">
              Drag from the gold dot below any person to connect them, or tap the
              dot then tap another person.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-5">
          {profile.job && (
            <DetailRow icon={Briefcase} label="Occupation" value={profile.job} />
          )}
          {profile.birthday && (
            <DetailRow
              icon={Calendar}
              label="Birthday"
              value={profile.birthday}
            />
          )}
          {profile.email && (
            <DetailRow icon={Mail} label="Email" value={profile.email} />
          )}
          {!profile.job && !profile.birthday && !profile.email && (
            <DetailRow icon={User} label="Details" value="No additional details" />
          )}
        </div>
          </>
        )}
      </div>

      {onDelete && (
        <div className="border-t border-line p-6">
          <button
            onClick={() => onDelete?.(memberId)}
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
  return buildDisplayRelationships(memberId, members, relationships);
}

function EditField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-muted">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {children}
    </div>
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
