"use client";

import { Plus } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Member } from "@/lib/types";
import { MemberSearch } from "./MemberSearch";

type HeaderProps = {
  members: Member[];
  onAddMember: () => void;
  onSearchSelect: (id: Id<"members">) => void;
};

export function Header({
  members,
  onAddMember,
  onSearchSelect,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 py-3 md:px-10 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-black md:h-10 md:w-10">
              <span className="font-serif text-base font-medium tracking-widest md:text-lg">
                L
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl font-light tracking-[0.15em] uppercase md:text-3xl md:tracking-[0.2em]">
                Lignée
              </h1>
              <p className="hidden text-[10px] uppercase tracking-[0.35em] text-muted sm:block">
                Family Heritage
              </p>
            </div>
          </div>

          <button
            onClick={onAddMember}
            className="group flex shrink-0 items-center gap-1.5 border border-black bg-black px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-ivory transition-all hover:bg-charcoal md:gap-2 md:px-5 md:py-2.5 md:text-[11px] md:tracking-[0.2em]"
          >
            <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {members.length > 0 && (
          <div className="mt-3 md:mt-4">
            <MemberSearch members={members} onSelect={onSearchSelect} />
          </div>
        )}
      </div>
    </header>
  );
}
