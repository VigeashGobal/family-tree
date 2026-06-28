"use client";

import { useMutation } from "convex/react";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import type { GenericId } from "convex/values";

type AddMemberModalProps = {
  onClose: () => void;
  onCreated?: (id: Id<"members">) => void;
};

export function AddMemberModal({ onClose, onCreated }: AddMemberModalProps) {
  const createMember = useMutation(api.members.create);
  const generateUploadUrl = useMutation(api.members.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
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

      const memberId = await createMember({
        name: name.trim(),
        job: job.trim() || undefined,
        birthday: birthday || undefined,
        email: email.trim() || undefined,
        pictureId,
      });

      onCreated?.(memberId);
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
          <div>
            <h2 className="font-serif text-xl tracking-[0.15em] uppercase">
              New Person
            </h2>
            <p className="mt-1 text-xs text-muted">
              Add their details — connect them on the canvas after
            </p>
          </div>
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
              autoFocus
            />
          </Field>

          <Field label="Occupation">
            <input
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="field-input"
              placeholder="Optional"
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
                placeholder="Optional"
              />
            </Field>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full border border-black bg-black py-3.5 text-[11px] uppercase tracking-[0.2em] text-ivory transition-all hover:bg-charcoal disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Person"}
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
