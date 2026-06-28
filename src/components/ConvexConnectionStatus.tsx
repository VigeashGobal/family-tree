"use client";

import { useConvexConnectionState } from "convex/react";
import { ReactNode, useEffect, useState } from "react";

export function ConvexConnectionStatus({
  children,
}: {
  children: ReactNode;
}) {
  const { hasEverConnected, connectionRetries, isWebSocketConnected } =
    useConvexConnectionState();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (hasEverConnected) {
      setTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, [hasEverConnected]);

  if (hasEverConnected) {
    return <>{children}</>;
  }

  if (timedOut && !isWebSocketConnected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 flex h-10 w-10 items-center justify-center border border-black">
          <span className="font-serif text-lg tracking-widest">L</span>
        </div>
        <h2 className="font-serif text-2xl font-light tracking-wide">
          Unable to connect
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          The app could not reach Convex. In Vercel, set{" "}
          <code className="rounded bg-cream px-2 py-0.5 text-xs text-charcoal">
            NEXT_PUBLIC_CONVEX_URL
          </code>{" "}
          to your <strong>production</strong> URL ending in{" "}
          <code className="rounded bg-cream px-2 py-0.5 text-xs text-charcoal">
            .convex.cloud
          </code>
          , then redeploy. Run{" "}
          <code className="rounded bg-cream px-2 py-0.5 text-xs text-charcoal">
            npx convex deploy
          </code>{" "}
          to publish backend functions.
        </p>
        {connectionRetries > 0 && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted">
            Retries: {connectionRetries}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-px w-12 animate-pulse bg-gold" />
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
          Connecting
        </p>
      </div>
    </div>
  );
}
