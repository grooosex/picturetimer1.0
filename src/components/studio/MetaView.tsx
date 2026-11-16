import { useState } from "react";
import { Trash2, X } from "lucide-react";
import type { NaiInfo } from "@/lib/nai/read";
import type { Photo } from "./types";

type Props = {
  photos: Photo[];
  photoId: string;
  info: NaiInfo;
  onClose: () => void;
  onChange: (id: string) => void;
  onDelete: (id: string) => void;
  onZoom: () => void;
};

export function MetaView({ photos, photoId, info, onClose, onChange, onDelete, onZoom }: Props) {
  const index = photos.findIndex((photo) => photo.id === photoId);
  const photo = photos[index];
  const [ask, setAsk] = useState(false);
  if (!photo) return null;
  const prev = index > 0 ? photos[index - 1] : null;
  const next = index >= 0 && index < photos.length - 1 ? photos[index + 1] : null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg text-fg">
      <div className="flex shrink-0 gap-3 px-4 pt-safe">
        <button type="button" aria-label="看大图" className="h-28 w-24 shrink-0 overflow-hidden rounded-md bg-surface ring-1 ring-line" onClick={onZoom}>
          {photo.thumb ? <img src={photo.thumb} alt="" className="h-full w-full object-cover" /> : null}
        </button>
        <div className="flex h-28 min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 items-start gap-1">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-2 text-xs leading-5">
              <p className="truncate">模型 {info.model}</p>
              <p className="truncate">步数 {info.steps}</p>
              <p className="truncate">种子 {info.seed}</p>
              <p className="truncate">CFG {info.cfg}</p>
            </div>
            <button type="button" aria-label="关闭" className="flex h-7 w-7 shrink-0 items-center justify-center" onClick={onClose}>
              <X size={18} strokeWidth={1.75} />
            </button>
            <button type="button" aria-label="从列表去掉" className="flex h-7 w-7 shrink-0 items-center justify-center" onClick={() => setAsk(true)}>
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
          <div className="mt-auto flex gap-2 pb-0.5">
            <button
              type="button"
              className="h-7 rounded-md px-2 text-xs ring-1 ring-line disabled:opacity-40"
              disabled={!prev}
              onClick={() => prev && onChange(prev.id)}
            >
              上一张
            </button>
            <button
              type="button"
              className="h-7 rounded-md px-2 text-xs ring-1 ring-line disabled:opacity-40"
              disabled={!next}
              onClick={() => next && onChange(next.id)}
            >
              下一张
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-safe">
        <h2 className="text-lg font-bold text-[#c23b33]">正面提示词</h2>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{info.positive || "—"}</p>
        {info.characters.length ? (
          <div className="mt-5">
            <h2 className="text-lg font-bold text-[#c23b33]">角色提示词</h2>
            {info.characters.map((line, number) => (
              <div key={`${number}-${line.slice(0, 12)}`} className="mt-3">
                <p className="text-xs text-muted">角色{number + 1}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{line}</p>
              </div>
            ))}
          </div>
        ) : null}
        <h2 className="mt-5 text-lg font-bold text-[#c23b33]">负面提示词</h2>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{info.negative || "—"}</p>
      </div>
      {ask ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-fg/40 px-6">
          <div className="w-full max-w-sm rounded-card bg-surface p-5 text-fg shadow-lg">
            <h2 className="text-lg font-medium">从列表里去掉这张？</h2>
            <p className="mt-2 text-sm text-muted">手机里的原图不会删。</p>
            <div className="mt-5 flex gap-3">
              <button type="button" className="h-11 flex-1 rounded-2xl ring-1 ring-line" onClick={() => setAsk(false)}>
                取消
              </button>
              <button type="button" className="h-11 flex-1 rounded-2xl bg-primary text-primary-fg" onClick={() => onDelete(photo.id)}>
                去掉
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
