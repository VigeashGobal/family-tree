"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { NODE_HEIGHT } from "@/lib/treeLayout";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.75;
const ZOOM_STEP = 0.12;

export type FocusTarget = {
  x: number;
  y: number;
  token: number;
};

export type TreeViewportHandle = {
  clientToCanvas: (clientX: number, clientY: number) => { x: number; y: number };
};

type TreeViewportProps = {
  canvasWidth: number;
  canvasHeight: number;
  focusTarget: FocusTarget | null;
  isConnecting?: boolean;
  children: ReactNode;
};

export const TreeViewport = forwardRef<TreeViewportHandle, TreeViewportProps>(
  function TreeViewport(
    { canvasWidth, canvasHeight, focusTarget, isConnecting, children },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.85);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const dragState = useRef<{
      pointerId: number;
      startX: number;
      startY: number;
      panX: number;
      panY: number;
    } | null>(null);

    const clampZoom = (value: number) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

    const centerCanvas = useCallback(
      (nextScale: number) => {
        const container = containerRef.current;
        if (!container) return;

        const { width, height } = container.getBoundingClientRect();
        setPan({
          x: (width - canvasWidth * nextScale) / 2,
          y: Math.max(24, (height - canvasHeight * nextScale) / 2),
        });
      },
      [canvasWidth, canvasHeight],
    );

    useImperativeHandle(
      ref,
      () => ({
        clientToCanvas: (clientX: number, clientY: number) => {
          const container = containerRef.current;
          if (!container) return { x: 0, y: 0 };

          const rect = container.getBoundingClientRect();
          return {
            x: (clientX - rect.left - pan.x) / scale,
            y: (clientY - rect.top - pan.y) / scale,
          };
        },
      }),
      [pan, scale],
    );

    useEffect(() => {
      if (canvasWidth > 0) {
        centerCanvas(scale);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasWidth, canvasHeight]);

    const focusOnPoint = useCallback((x: number, y: number) => {
      const container = containerRef.current;
      if (!container) return;

      const targetScale = clampZoom(1);
      const { width, height } = container.getBoundingClientRect();
      const centerY = y + NODE_HEIGHT / 2;

      setScale(targetScale);
      setPan({
        x: width / 2 - x * targetScale,
        y: height / 2 - centerY * targetScale,
      });
    }, []);

    useEffect(() => {
      if (!focusTarget) return;
      focusOnPoint(focusTarget.x, focusTarget.y);
    }, [focusTarget, focusOnPoint]);

    function handleZoomIn() {
      setScale((s) => clampZoom(s + ZOOM_STEP));
    }

    function handleZoomOut() {
      setScale((s) => clampZoom(s - ZOOM_STEP));
    }

    function handleReset() {
      const next = 0.85;
      setScale(next);
      centerCanvas(next);
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
      if (isConnecting) return;

      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("[data-connection-handle]")
      ) {
        return;
      }

      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      setPan({
        x: drag.panX + (e.clientX - drag.startX),
        y: drag.panY + (e.clientY - drag.startY),
      });
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
      if (dragState.current?.pointerId === e.pointerId) {
        dragState.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }

    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setScale((s) => clampZoom(s + delta));
    }

    return (
      <div className="relative flex-1 overflow-hidden bg-ivory">
        <div
          ref={containerRef}
          className={`h-full w-full touch-none ${
            isConnecting ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <div
            className="relative will-change-transform"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              minHeight: 300,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            {children}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 right-4 z-30 flex flex-col gap-2 md:bottom-6 md:right-6">
          <div className="pointer-events-auto flex flex-col border border-line bg-ivory/95 shadow-lg backdrop-blur-sm">
            <button
              type="button"
              onClick={handleZoomIn}
              className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:bg-cream md:h-10 md:w-10"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="h-px bg-line" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:bg-cream md:h-10 md:w-10"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="h-px bg-line" />
            <button
              type="button"
              onClick={handleReset}
              className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:bg-cream md:h-10 md:w-10"
              aria-label="Reset view"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="pointer-events-none text-center text-[9px] uppercase tracking-[0.2em] text-muted">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>
    );
  },
);
