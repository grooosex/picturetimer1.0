import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  batchStamp,
  computePlan,
  formatClock,
  formatInterval,
  formatLocalInput,
  parseLocalInput,
  touchOwned,
  type Field,
  type Plan,
} from "@/lib/timeplan";
import type { Photo } from "./types";

type Props = {
  open: boolean;
  photos: Photo[];
  progress: { done: number; total: number } | null;
  onClose: () => void;
  onConfirm: (plan: Plan, strict: boolean) => void;
  onStop: () => void;
};

export function ExportSheet({ open, photos, progress, onClose, onConfirm, onStop }: Props) {
  const [anchor, setAnchor] = useState(() => Date.now());
  const [owned, setOwned] = useState<Field[]>([]);
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [intervalText, setIntervalText] = useState("");
  const [unit, setUnit] = useState<"s" | "m">("s");
  const [strict, setStrict] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAnchor(Date.now());
    setOwned([]);
    setStartText("");
    setEndText("");
    setIntervalText("");
    setUnit("s");
  }, [open]);

  if (!open) return null;

  const startMs = owned.includes("start") ? parseLocalInput(startText) : null;
  const endMs = owned.includes("end") ? parseLocalInput(endText) : null;
  const intervalMs = owned.includes("interval") ? readInterval(intervalText, unit) : null;
  const plan = computePlan({ n: photos.length, now: anchor, owned, startMs, endMs, intervalMs });
  const first = photos[0];
  const last = photos[photos.length - 1];
  const sample = batchStamp(anchor);

  function own(field: Field) {
    const next = touchOwned(owned, field);
    setOwned(next);
    if (!next.includes("start")) setStartText("");
    if (!next.includes("end")) setEndText("");
    if (!next.includes("interval")) setIntervalText("");
  }

  function changeUnit(next: "s" | "m") {
    if (owned.includes("interval")) {
      const ms = readInterval(intervalText, unit);
      if (ms != null) setIntervalText(formatInterval(ms, next));
    }
    setUnit(next);
  }

  const startValue = owned.includes("start") ? startText : plan.error ? "" : formatLocalInput(plan.startMs);
  const endValue = owned.includes("end") ? endText : plan.error ? "" : formatLocalInput(plan.endMs);
  const intervalValue = owned.includes("interval") ? intervalText : plan.error ? "" : formatInterval(plan.intervalMs, unit);

  return (
    <div className="fixed inset-0 z-40 bg-fg/40">
      <button type="button" aria-label="关闭" className="absolute inset-0" onClick={() => { if (!progress) onClose(); }} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-card bg-surface px-4 pt-4 pb-safe text-fg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-3xl leading-none">输出</h2>
            <button
              type="button"
              aria-pressed={strict}
              disabled={!!progress}
              onClick={() => setStrict((on) => !on)}
              className={`h-8 rounded-full px-3 text-sm ${strict ? "bg-primary text-primary-fg" : "bg-surface ring-1 ring-line"}`}
            >
              强化
            </button>
          </div>
          <button type="button" aria-label="关闭" className="flex h-11 w-11 items-center justify-center" onClick={() => { if (!progress) onClose(); }} disabled={!!progress}>
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>
        {progress ? (
          <div className="pb-4">
            <p className="text-lg">正在保存 {progress.done}/{progress.total}</p>
            <p className="mt-2 text-sm text-muted">写进已选的文件夹。写完读出拍摄时间，必须正好隔开你定的间隔，才写下一张。</p>
            <button type="button" className="mt-5 h-12 w-full rounded-2xl ring-1 ring-line" onClick={onStop}>
              停止
            </button>
          </div>
        ) : (
          <>
            <Field label="开始时间" hint="右下 · 最早" auto={plan.autoStart}>
              <input
                type="datetime-local"
                step={1}
                value={startValue}
                onChange={(event) => {
                  own("start");
                  setStartText(event.target.value);
                }}
                className={`h-12 w-full rounded-xl px-3 text-base ring-1 ring-line ${plan.autoStart ? "bg-bg" : "bg-surface"}`}
              />
            </Field>
            <Field label="间隔" hint="" auto={plan.autoInterval}>
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  value={intervalValue}
                  onChange={(event) => {
                    own("interval");
                    setIntervalText(event.target.value);
                  }}
                  className={`h-12 w-24 rounded-xl px-3 text-center text-base ring-1 ring-line ${plan.autoInterval ? "bg-bg" : "bg-surface"}`}
                />
                <div className="flex h-12 flex-1 overflow-hidden rounded-xl ring-1 ring-line">
                  <button type="button" className={`flex-1 ${unit === "s" ? "bg-primary text-primary-fg" : "bg-surface"}`} onClick={() => changeUnit("s")}>
                    秒
                  </button>
                  <button type="button" className={`flex-1 ${unit === "m" ? "bg-primary text-primary-fg" : "bg-surface"}`} onClick={() => changeUnit("m")}>
                    分钟
                  </button>
                </div>
              </div>
            </Field>
            <Field label="结束时间" hint="左上 · 最新" auto={plan.autoEnd}>
              <input
                type="datetime-local"
                step={1}
                value={endValue}
                onChange={(event) => {
                  own("end");
                  setEndText(event.target.value);
                }}
                className={`h-12 w-full rounded-xl px-3 text-base ring-1 ring-line ${plan.autoEnd ? "bg-bg" : "bg-surface"}`}
              />
            </Field>
            <p className={`mt-4 text-sm ${plan.error ? "text-primary" : "text-fg"}`}>
              {plan.error
                ? plan.error
                : `共 ${photos.length} 张，左上 ${formatClock(plan.endMs)}，右下 ${formatClock(plan.startMs)}，间隔 ${formatInterval(plan.intervalMs, unit)} ${unit === "m" ? "分钟" : "秒"}`}
            </p>
            {plan.usesNow ? <p className="mt-1 text-sm text-muted">没填的时间，以按下确定的那一刻为准。</p> : null}
            {first ? (
              <p className="mt-3 text-xs break-all text-muted">
                {`ord_${sample}_001.${first.ext}`}
                {last && photos.length > 1 ? ` 到 ord_${sample}_${String(photos.length).padStart(3, "0")}.${last.ext}` : ""}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">画面不重画。时间不对或漏一张会停住，重试还是这一轮。</p>
            <div className="mt-4 mb-2 flex gap-3">
              <button type="button" className="h-12 flex-1 rounded-2xl ring-1 ring-line" onClick={onClose}>
                取消
              </button>
              <button
                type="button"
                disabled={!!plan.error}
                className="h-12 flex-1 rounded-2xl bg-primary text-primary-fg disabled:opacity-40"
                onClick={() => {
                  const fresh = computePlan({
                    n: photos.length,
                    now: Date.now(),
                    owned,
                    startMs,
                    endMs,
                    intervalMs,
                  });
                  if (!fresh.error) onConfirm(fresh, strict);
                }}
              >
                确定
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, auto, children }: { label: string; hint: string; auto: boolean; children: ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1.5 flex items-center gap-2 text-sm">
        <span>{label}</span>
        {hint ? <span className="text-muted">{hint}</span> : null}
        {auto ? <span className="text-primary">自动</span> : null}
      </span>
      {children}
    </label>
  );
}

function readInterval(text: string, unit: "s" | "m"): number | null {
  if (!text.trim()) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return value * (unit === "m" ? 60_000 : 1000);
}
