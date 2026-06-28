"use client";

import { Plus } from "lucide-react";

type HeaderProps = {
  onAddMember: () => void;
};

export function Header({ onAddMember }: HeaderProps) {
  return (
    <header className="border-b border-line bg-ivory/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center border border-black">
            <span className="font-serif text-lg font-medium tracking-widest">
              L
            </span>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-light tracking-[0.2em] uppercase md:text-3xl">
              Lignée
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted">
              Family Heritage
            </p>
          </div>
        </div>

        <button
          onClick={onAddMember}
          className="group flex items-center gap-2 border border-black bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-ivory transition-all hover:bg-charcoal"
        >
          <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
          Add Member
        </button>
      </div>
    </header>
  );
}
