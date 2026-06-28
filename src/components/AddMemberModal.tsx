"use client";

import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Member, RELATIONSHIP_LABELS, RelationshipType } from "@/lib/types";

type MemberLink = {
  relatedMemberId: string;
  relationship: RelationshipType;
};

type AddMemberModalProps = {
  members: Member[];
  onClose: () => void;
};

const emptyLink = (): MemberLink => ({
  relatedMemberId: "",
  relationship: "child",
});

export function AddMemberModal({ members, onClose }: AddMemberModalProps) {
  const createMember = useMutation(api.members.create);
  const generateUploadUrl = useMutation(api.members.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [links, setLinks] = useState<MemberLink[]>([emptyLink()]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirstMember = members.length === 0;

  function updateLink(index: number, patch: Partial<MemberLink>) {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function addLink() {
    setLinks((prev) => [...prev, emptyLink()]);
  }

  function removeLink(index: number) {
    setLinks((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const validLinks = links.filter((l) => l.relatedMemberId);

    if (!isFirstMember && validLinks.length === 0) {
      setError("Add at least one relationship");
      return;
    }

    setSubmitting(true);
    setError(null);

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

      await createMember({
        name: name.trim(),
        job: job.trim() || undefined,
        birthday: birthday || undefined,
        email: email.trim() || undefined,
        pictureId,
        links: validLinks.map((link) => ({
          relatedMemberId: link.relatedMemberId as Id<"members">,
          relationship: link.relationship,
        })),
      });

      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPictureFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-fade-in relative w-full max-w-lg border border-line bg-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-xl tracking-[0.15em] uppercase">
            {isFirstMember ? "First Member" : "New Member"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6">
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-line bg-cream transition-colors hover:border-gold"
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center text-muted">
                  <Upload className="mb-1 h-5 w-5" />
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
          </div>

          <Field label="Full Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
              placeholder="e.g. Gabrielle Chanel"
            />
          </Field>

          <Field label="Occupation">
            <input
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="field-input"
              placeholder="e.g. Fashion Designer"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Birthday">
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="field-input"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="email@example.com"
              />
            </Field>
          </div>

          {!isFirstMember && (
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.25em] text-muted">
                  Relationships<span className="text-gold"> *</span>
                </label>
                <button
                  type="button"
                  onClick={addLink}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-gold transition-colors hover:text-charcoal"
                >
                  <Plus className="h-3 w-3" />
                  Add connection
                </button>
              </div>

              <div className="space-y-3">
                {links.map((link, index) => (
                  <div
                    key={index}
                    className="border border-line bg-cream/40 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted">
                        Connection {index + 1}
                      </span>
                      {links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="text-muted transition-colors hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <select
                      value={link.relatedMemberId}
                      onChange={(e) =>
                        updateLink(index, { relatedMemberId: e.target.value })
                      }
                      className="field-input mb-2"
                    >
                      <option value="">Select a family member</option>
                      {members.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={link.relationship}
                      onChange={(e) =>
                        updateLink(index, {
                          relationship: e.target.value as RelationshipType,
                        })
                      }
                      className="field-input"
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full border border-black bg-black py-3.5 text-[11px] uppercase tracking-[0.2em] text-ivory transition-all hover:bg-charcoal disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Add to Tree"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
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
