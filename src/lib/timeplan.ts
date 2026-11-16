export type Field = "start" | "end" | "interval";

export type PlanInput = {
  n: number;
  now: number;
  owned: Field[];
  startMs: number | null;
  endMs: number | null;
  intervalMs: number | null;
};

export type Plan = {
  startMs: number;
  endMs: number;
  intervalMs: number;
  times: number[];
  error: string | null;
  autoStart: boolean;
  autoEnd: boolean;
  autoInterval: boolean;
  usesNow: boolean;
};

export function touchOwned(owned: Field[], field: Field): Field[] {
  return [...owned.filter((item) => item !== field), field].slice(-2);
}

function failed(message: string, owned: Field[]): Plan {
  return {
    startMs: 0,
    endMs: 0,
    intervalMs: 0,
    times: [],
    error: message,
    autoStart: !owned.includes("start"),
    autoEnd: !owned.includes("end"),
    autoInterval: !owned.includes("interval"),
    usesNow: false,
  };
}

export function computePlan(input: PlanInput): Plan {
  const { n, now, owned } = input;
  const autoStart = !owned.includes("start");
  const autoEnd = !owned.includes("end");
  const autoInterval = !owned.includes("interval");

  if (owned.includes("interval") && (input.intervalMs == null || input.intervalMs <= 0)) {
    return failed("间隔要大于 0", owned);
  }
  if (owned.includes("start") && input.startMs == null) {
    return failed("开始时间不完整", owned);
  }
  if (owned.includes("end") && input.endMs == null) {
    return failed("结束时间不完整", owned);
  }
  if (n <= 0) return failed("没有图片", owned);

  const hasS = owned.includes("start");
  const hasE = owned.includes("end");
  const hasI = owned.includes("interval");
  const usesNow = !hasS && !hasE;

  if (n === 1) {
    if (hasS && hasE && input.startMs !== input.endMs) {
      return failed("只有一张，开始和结束要相同", owned);
    }
    const t = hasE ? input.endMs! : hasS ? input.startMs! : now;
    return {
      startMs: t,
      endMs: t,
      intervalMs: hasI ? input.intervalMs! : 1000,
      times: [t],
      error: null,
      autoStart,
      autoEnd,
      autoInterval,
      usesNow,
    };
  }

  let start = hasS ? input.startMs! : 0;
  let end = hasE ? input.endMs! : 0;
  let interval = hasI ? input.intervalMs! : 1000;

  if (hasS && hasE) interval = (end - start) / (n - 1);
  else if (hasS && hasI) end = start + (n - 1) * interval;
  else if (hasE && hasI) start = end - (n - 1) * interval;
  else if (hasS) {
    interval = 1000;
    end = start + (n - 1) * interval;
  } else if (hasE) {
    interval = 1000;
    start = end - (n - 1) * interval;
  } else if (hasI) {
    end = now;
    start = end - (n - 1) * interval;
  } else {
    interval = 1000;
    end = now;
    start = end - (n - 1) * interval;
  }

  if (!(end > start)) return failed("结束时间要晚于开始时间", owned);

  const times = Array.from({ length: n }, (_, index) =>
    Math.round(end - ((end - start) * index) / (n - 1)),
  );
  times[0] = Math.round(end);
  times[n - 1] = Math.round(start);
  for (let index = 0; index < times.length - 1; index += 1) {
    if (times[index] <= times[index + 1]) {
      return failed("间隔太小，有的图会落到同一毫秒", owned);
    }
  }

  return {
    startMs: times[n - 1],
    endMs: times[0],
    intervalMs: interval,
    times,
    error: null,
    autoStart,
    autoEnd,
    autoInterval,
    usesNow,
  };
}

export function formatClock(ms: number): string {
  const date = new Date(ms);
  const p = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

export function formatLocalInput(ms: number): string {
  return formatClock(ms).replace(" ", "T");
}

export function parseLocalInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const date = new Date(year, month - 1, day, hour, minute, second);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return null;
  }
  return date.getTime();
}

export function formatInterval(ms: number, unit: "s" | "m"): string {
  const value = unit === "m" ? ms / 60_000 : ms / 1000;
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

export function batchStamp(ms: number): string {
  const date = new Date(ms);
  const p = (value: number, length = 2) => String(value).padStart(length, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}_${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}${p(date.getMilliseconds(), 3)}`;
}
