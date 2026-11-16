import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { Photo } from "./types";

type Props = {
  photos: Photo[];
  photoId: string;
  origin: DOMRect | null;
  onClose: () => void;
  onChange: (id: string) => void;
  onDelete: (id: string) => void;
};

export function Lightbox({ photos, photoId, origin, onClose, onChange, onDelete }: Props) {
  const photo = photos.find((item) => item.id === photoId);
  const index = photo ? photos.findIndex((item) => item.id === photo.id) : -1;
  const frameRef = useRef<HTMLImageElement>(null);
  const opened = useRef(false);
  const canTurn = useRef(false);
  const [url, setUrl] = useState("");
  const [ask, setAsk] = useState(false);
  const [dim, setDim] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      canTurn.current = true;
    }, 400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!photo) return;
    const next = URL.createObjectURL(photo.file);
    setUrl(next);
    const el = frameRef.current;
    if (el && opened.current) el.style.transform = "none";
    return () => URL.revokeObjectURL(next);
  }, [photo]);

  function settle() {
    const el = frameRef.current;
    if (!el || opened.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || !origin || reduced) {
      opened.current = true;
      el.style.transform = "none";
      return;
    }
    const scale = Math.min(origin.width / box.width, origin.height / box.height);
    const tx = origin.left + origin.width / 2 - (box.left + box.width / 2);
    const ty = origin.top + origin.height / 2 - (box.top + box.height / 2);
    el.style.transition = "none";
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    requestAnimationFrame(() => {
      el.style.transition = "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      el.style.transform = "none";
      opened.current = true;
    });
  }

  function close() {
    const el = frameRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cell = photo ? document.querySelector<HTMLElement>(`[data-photo-id="${photo.id}"]`) : null;
    if (!el || !cell || reduced) {
      onClose();
      return;
    }
    cell.scrollIntoView({ block: "nearest", inline: "nearest" });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = cell.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        if (target.width < 2 || box.width < 2) {
          onClose();
          return;
        }
        const scale = Math.min(target.width / box.width, target.height / box.height);
        const tx = target.left + target.width / 2 - (box.left + box.width / 2);
        const ty = target.top + target.height / 2 - (box.top + box.height / 2);
        setDim(false);
        let closed = false;
        const done = () => {
          if (closed) return;
          closed = true;
          onClose();
        };
        el.addEventListener("transitionend", done, { once: true });
        window.setTimeout(done, 360);
        el.style.transition = "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      });
    });
  }

  function onNavigate(event: React.MouseEvent<HTMLDivElement>) {
    if (!canTurn.current || ask) return;
    const el = frameRef.current;
    const box = el?.getBoundingClientRect();
    const mid = box && box.width > 2 ? box.left + box.width / 2 : window.innerWidth / 2;
    const step = event.clientX < mid ? -1 : 1;
    const next = photos[index + step];
    if (next) onChange(next.id);
  }

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-40 touch-manipulation" onClick={onNavigate}>
      <div className={`absolute inset-0 bg-bg transition-opacity duration-300 ${dim ? "opacity-100" : "opacity-0"}`} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 py-16">
        <img ref={frameRef} src={url} alt="" className="max-h-full max-w-full object-contain" draggable={false} onLoad={settle} />
      </div>
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-safe">
        <button
          type="button"
          aria-label="关闭"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-fg ring-1 ring-line"
          onClick={(event) => {
            event.stopPropagation();
            close();
          }}
        >
          <X size={22} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="从列表去掉"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-fg ring-1 ring-line"
          onClick={(event) => {
            event.stopPropagation();
            setAsk(true);
          }}
        >
          <Trash2 size={20} strokeWidth={1.75} />
        </button>
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-muted">点左边上一张，点右边下一张</p>
      {ask ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-fg/40 px-6" onClick={(event) => event.stopPropagation()}>
          <div className="w-full max-w-sm rounded-card bg-surface p-5 text-fg shadow-lg">
            <h2 className="text-lg font-medium">从列表里去掉这张？</h2>
            <p className="mt-2 text-sm text-muted">手机里的原图不会删。</p>
            <div className="mt-5 flex gap-3">
              <button type="button" className="h-11 flex-1 rounded-2xl ring-1 ring-line" onClick={() => setAsk(false)}>
                取消
              </button>
              <button
                type="button"
                className="h-11 flex-1 rounded-2xl bg-primary text-primary-fg"
                onClick={() => {
                  setAsk(false);
                  onDelete(photo.id);
                }}
              >
                去掉
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}