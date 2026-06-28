"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Member } from "@/lib/types";

type MemberSearchProps = {
  members: Member[];
  onSelect: (id: Id<"members">) => void;
};

export function MemberSearch({ members, onSelect }: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.job?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [members, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: Id<"members">) {
    onSelect(id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search family..."
          className="field-input w-full py-2.5 pl-10 pr-10 text-sm"
          aria-label="Search family members"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto border border-line bg-ivory shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No members found</p>
          ) : (
            results.map((member) => (
              <button
                key={member._id}
                type="button"
                onClick={() => handleSelect(member._id)}
                className="flex w-full flex-col border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-cream"
              >
                <span className="font-serif text-base text-charcoal">
                  {member.name}
                </span>
                {member.job && (
                  <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
                    {member.job}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
