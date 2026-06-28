export function SetupScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex h-10 w-10 items-center justify-center border border-black">
        <span className="font-serif text-lg tracking-widest">L</span>
      </div>
      <h2 className="font-serif text-3xl font-light tracking-wide">
        Setup Required
      </h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Connect Convex to enable your family tree. Run{" "}
        <code className="rounded bg-cream px-2 py-0.5 text-xs text-charcoal">
          npx convex dev
        </code>{" "}
        in your terminal, then restart the dev server.
      </p>
    </div>
  );
}
