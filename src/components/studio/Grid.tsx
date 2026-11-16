import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Photo } from "./types";

type Props = {
  photos: Photo[];
  onOpen: (id: string, rect: DOMRect) => void;
  onReorder: (from: number, to: number) => void;
};

const COLUMNS = 4;

type Box = { left: number; top: number; right: number; bottom: number };
type GridGeom = {
  originX: number;
  originY: number;
  strideX: number;
  strideY: number;
  cellW: number;
  cellH: number;
  scrollTop: number;
};

type DragOrigin = { left: number; top: number; w: number; h: number; px: number; py: number };

export function Grid({ photos, onOpen, onReorder }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const blockClick = useRef(false);
  const dragRef = useRef<string | null>(null);
  const point = useRef({ x: 0, y: 0 });
  const ghost = useRef<HTMLDivElement>(null);
  const ghostSize = useRef({ w: 72, h: 96 });
  const dragOrigin = useRef<DragOrigin>({ left: 0, top: 0, w: 0, h: 0, px: 0, py: 0 });
  const gridGeom = useRef<GridGeom | null>(null);
  const indexRef = useRef(-1);
  const positions = useRef(new Map<string, DOMRect>());
  const [dragId, setDragId] = useState<string | null>(null);
  const dragging = photos.find((photo) => photo.id === dragId);

  useLayoutEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-photo-id]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextPositions = new Map<string, DOMRect>();
    for (const node of nodes) {
      node.getAnimations().forEach((animation) => animation.cancel());
      const id = node.dataset.photoId;
      if (!id) continue;
      const next = node.getBoundingClientRect();
      nextPositions.set(id, next);
      if (!dragRef.current || reduced) continue;
      const prev = positions.current.get(id);
      if (!prev) continue;
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 170, easing: "ease-out" });
    }
    positions.current = nextPositions;
  });

  useLayoutEffect(() => {
    if (!dragId || !ghost.current) return;
    placeGhost(point.current.x, point.current.y);
  }, [dragId]);

  useEffect(() => {
    if (!dragId) return;
    let frame = 0;
    let lastTop = scrollerRef.current?.scrollTop ?? 0;
    const tick = () => {
      const scroller = scrollerRef.current;
      const y = point.current.y;
      if (scroller) {
        const rect = scroller.getBoundingClientRect();
        if (y < rect.top + 80) scroller.scrollTop -= 16;
        else if (y > rect.bottom - 88) scroller.scrollTop += 16;
        if (scroller.scrollTop !== lastTop) {
          lastTop = scroller.scrollTop;
          rememberPositions();
        }
      }
      moveTo();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragId]);

  function rememberPositions() {
    const next = new Map<string, DOMRect>();
    document.querySelectorAll<HTMLElement>("[data-photo-id]").forEach((node) => {
      node.getAnimations().forEach((animation) => animation.cancel());
      const id = node.dataset.photoId;
      if (id) next.set(id, node.getBoundingClientRect());
    });
    positions.current = next;
  }

  function placeGhost(x: number, y: number) {
    point.current = { x, y };
    const node = ghost.current;
    const origin = dragOrigin.current;
    if (!node || origin.w < 2) return;
    node.style.left = `${origin.left + (x - origin.px)}px`;
    node.style.top = `${origin.top + (y - origin.py)}px`;
  }

  function currentGhost(): Box | null {
    const origin = dragOrigin.current;
    if (origin.w < 2) return null;
    const left = origin.left + (point.current.x - origin.px);
    const top = origin.top + (point.current.y - origin.py);
    return { left, top, right: left + origin.w, bottom: top + origin.h };
  }

  function captureGrid() {
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-photo-id]")];
    const first = nodes[0];
    if (!first) {
      gridGeom.current = null;
      return;
    }
    const rect = first.getBoundingClientRect();
    const next = nodes[1]?.getBoundingClientRect();
    const below = nodes[COLUMNS]?.getBoundingClientRect();
    const rowGap = parseFloat(getComputedStyle(first.parentElement ?? first).rowGap) || 6;
    gridGeom.current = {
      originX: rect.left,
      originY: rect.top,
      strideX: next ? next.left - rect.left : rect.width,
      strideY: below ? below.top - rect.top : rect.height + rowGap,
      cellW: rect.width,
      cellH: rect.height,
      scrollTop: scrollerRef.current?.scrollTop ?? 0,
    };
  }

  function slotAt(box: Box, count: number) {
    const geom = gridGeom.current;
    if (!geom || geom.cellW < 2 || geom.strideX < 2 || geom.strideY < 2) return -1;
    const originY = geom.originY - ((scrollerRef.current?.scrollTop ?? 0) - geom.scrollTop);
    let column = -1;
    for (let index = 0; index < COLUMNS; index += 1) {
      const mid = geom.originX + index * geom.strideX + geom.cellW / 2;
      if (box.left < mid && box.right > mid) {
        column = index;
        break;
      }
    }
    const rows = Math.ceil(count / COLUMNS);
    let row = -1;
    for (let index = 0; index < rows; index += 1) {
      const mid = originY + index * geom.strideY + geom.cellH / 2;
      if (box.top < mid && box.bottom > mid) {
        row = index;
        break;
      }
    }
    if (column < 0 || row < 0) return -1;
    const index = row * COLUMNS + column;
    if (index >= count) return -1;
    return index;
  }

  function moveTo() {
    const from = indexRef.current;
    if (from < 0 || !dragRef.current) return;
    const box = currentGhost();
    if (!box) return;
    const target = slotAt(box, photosRef.current.length);
    if (target < 0 || target === from) return;
    indexRef.current = target;
    onReorder(from, target);
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointer = event.pointerId;
    const target = event.currentTarget;
    const scroller = scrollerRef.current;
    let mode: "pending" | "scroll" | "drag" = "pending";
    let lastY = startY;
    let timer: number | null = window.setTimeout(() => {
      timer = null;
      if (mode !== "pending") return;
      mode = "drag";
      blockClick.current = true;
      dragRef.current = id;
      const rect = target.getBoundingClientRect();
      const from = photosRef.current.findIndex((photo) => photo.id === id);
      indexRef.current = from;
      dragOrigin.current = { left: rect.left, top: rect.top, w: rect.width, h: rect.height, px: startX, py: startY };
      ghostSize.current = { w: rect.width, h: rect.height };
      captureGrid();
      if (scroller) scroller.style.touchAction = "none";
      target.setPointerCapture?.(pointer);
      placeGhost(startX, startY);
      setDragId(id);
    }, 400);

    const onTouchMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      if (!touch || ev.touches.length > 1) return;
      ev.preventDefault();
      if (mode === "drag") return;
      const dy = touch.clientY - lastY;
      lastY = touch.clientY;
      const dist = Math.hypot(touch.clientX - startX, touch.clientY - startY);
      if (mode === "pending" && dist > 22) {
        mode = "scroll";
        if (timer != null) window.clearTimeout(timer);
        timer = null;
        blockClick.current = true;
      }
      if (mode === "scroll" && scroller) scroller.scrollTop -= dy;
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointer || mode !== "drag") return;
      ev.preventDefault();
      placeGhost(ev.clientX, ev.clientY);
      moveTo();
    };
    const end = (ev: PointerEvent, cancelled: boolean) => {
      if (ev.pointerId !== pointer) return;
      if (timer != null) window.clearTimeout(timer);
      detach();
      if (scroller) scroller.style.touchAction = "";
      const tapped = !cancelled && mode === "pending" && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 12;
      if (dragRef.current) {
        dragRef.current = null;
        indexRef.current = -1;
        setDragId(null);
      }
      if (tapped) {
        blockClick.current = true;
        onOpen(id, target.getBoundingClientRect());
      }
    };
    const detach = () => {
      document.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    const onUp = (ev: PointerEvent) => end(ev, false);
    const onCancel = (ev: PointerEvent) => end(ev, true);
    document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  return (
    <>
      <div ref={scrollerRef} className={`min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 pb-4 ${dragId ? "touch-none" : ""}`}>
        <div className="grid grid-cols-4 gap-1.5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              data-photo-id={photo.id}
              className={`relative aspect-[3/4] overflow-hidden rounded-md bg-surface ring-1 ring-line select-none ${
                dragId === photo.id ? "opacity-40" : ""
              }`}
              onPointerDown={(event) => onPointerDown(event, photo.id)}
              onContextMenu={(event) => event.preventDefault()}
              onClick={() => {
                if (blockClick.current) {
                  blockClick.current = false;
                  return;
                }
                const node = document.querySelector<HTMLElement>(`[data-photo-id="${photo.id}"]`);
                if (node) onOpen(photo.id, node.getBoundingClientRect());
              }}
            >
              {photo.thumb ? (
                <img src={photo.thumb} alt="" className="h-full w-full object-contain" draggable={false} />
              ) : (
                <span className="flex h-full items-center px-1 text-center text-xs text-muted">无预览</span>
              )}
              {photo.reason ? (
                <span className="absolute inset-x-0 bottom-0 bg-primary px-1 py-0.5 text-xs text-primary-fg">不能写</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      {dragging ? (
        <div
          ref={ghost}
          className="pointer-events-none fixed z-30 overflow-hidden rounded-md bg-surface shadow-lg ring-1 ring-line"
          style={{ width: ghostSize.current.w, height: ghostSize.current.h }}
        >
          {dragging.thumb ? <img src={dragging.thumb} alt="" className="h-full w-full object-contain" /> : null}
        </div>
      ) : null}
    </>
  );
}