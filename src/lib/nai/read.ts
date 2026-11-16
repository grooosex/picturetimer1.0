import { readPngChunks } from "../stamp/png.ts";

export type NaiInfo = {
  model: string;
  steps: string;
  seed: string;
  cfg: string;
  positive: string;
  negative: string;
  characters: string[];
};

const MODELS: Record<string, string> = {
  "nai-diffusion-4-5-full": "NAI V4.5 Full",
  "nai-diffusion-4-5-curated": "NAI V4.5 Curated",
  "nai-diffusion-4-full": "NAI V4 Full",
  "nai-diffusion-4-curated": "NAI V4 Curated",
  "nai-diffusion-3": "NAI V3",
  "nai-diffusion-furry-3": "NAI Furry V3",
  "nai-diffusion-2": "NAI V2",
  "nai-diffusion": "NAI V1",
  "safe-diffusion": "NAI Safe",
};

const MAGIC = "stealth_pngcomp";

function modelLabel(model: string): string {
  if (!model) return "—";
  return MODELS[model] ?? model;
}

function num(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return "—";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function characterLines(value: unknown): { base: string; chars: string[] } | null {
  const caption = asRecord(asRecord(value)?.caption);
  if (!caption) return null;
  const base = typeof caption.base_caption === "string" ? caption.base_caption : "";
  const chars: string[] = [];
  if (Array.isArray(caption.char_captions)) {
    for (const item of caption.char_captions) {
      const text = asRecord(item);
      const line = text && typeof text.char_caption === "string" ? text.char_caption.trim() : "";
      if (line) chars.push(line);
    }
  }
  return { base, chars };
}

export function toInfo(raw: Record<string, unknown>): NaiInfo | null {
  let obj = raw;
  if (typeof obj.Comment === "string") {
    try {
      const inner = asRecord(JSON.parse(obj.Comment));
      if (inner) obj = inner;
    } catch {
      return null;
    }
  } else if (asRecord(obj.Comment)) {
    obj = obj.Comment as Record<string, unknown>;
  }
  const positiveV4 = characterLines(obj.v4_prompt);
  const negativeV4 = characterLines(obj.v4_negative_prompt);
  const fromPrompt = typeof obj.prompt === "string" ? obj.prompt : "";
  const fromUc = typeof obj.uc === "string" ? obj.uc : "";
  const positive = positiveV4?.base.trim() ? positiveV4.base : fromPrompt;
  const negative = negativeV4?.base.trim() ? negativeV4.base : fromUc;
  const characters = positiveV4?.chars ?? [];
  const model = typeof obj.model === "string" ? obj.model : "";
  const known = model || positive || negative || characters.length || obj.steps != null || obj.seed != null || obj.scale != null;
  if (!known) return null;
  return {
    model: modelLabel(model),
    steps: num(obj.steps),
    seed: num(obj.seed),
    cfg: num(obj.scale),
    positive,
    negative,
    characters,
  };
}

function parseComment(text: string): NaiInfo | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  try {
    const data = asRecord(JSON.parse(text.slice(start)));
    return data ? toInfo(data) : null;
  } catch {
    return null;
  }
}

function chunkText(type: string, data: Uint8Array): string | null {
  const decode = (bytes: Uint8Array) => new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (type === "tEXt") {
    const zero = data.indexOf(0);
    if (zero < 0) return null;
    const key = decode(data.subarray(0, zero));
    if (key !== "Comment" && key !== "Description") return null;
    return decode(data.subarray(zero + 1));
  }
  if (type !== "iTXt") return null;
  const zero = data.indexOf(0);
  if (zero < 0 || zero + 2 >= data.length || data[zero + 1] !== 0) return null;
  const key = decode(data.subarray(0, zero));
  if (key !== "Comment" && key !== "Description") return null;
  const langEnd = data.indexOf(0, zero + 3);
  if (langEnd < 0) return null;
  const nameEnd = data.indexOf(0, langEnd + 1);
  if (nameEnd < 0) return null;
  return decode(data.subarray(nameEnd + 1));
}

export function readTextMeta(bytes: Uint8Array): NaiInfo | null {
  const chunks = readPngChunks(bytes);
  if (!chunks) return null;
  for (const chunk of chunks) {
    const text = chunkText(chunk.type, chunk.data);
    if (!text) continue;
    const info = parseComment(text);
    if (info) return info;
  }
  return null;
}

function stealthPayload(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number): Uint8Array | null {
  const pixels = width * height;
  if (pixels < (MAGIC.length + 4) * 8 || rgba.length < pixels * 4) return null;
  const byteCount = Math.floor(pixels / 8);
  const packed = new Uint8Array(byteCount);
  let bit = 0;
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      const alpha = rgba[(y * width + x) * 4 + 3] & 1;
      packed[bit >> 3] |= alpha << (7 - (bit & 7));
      bit += 1;
      if (bit >= byteCount * 8) break;
    }
    if (bit >= byteCount * 8) break;
  }
  const magic = new TextDecoder().decode(packed.subarray(0, MAGIC.length));
  if (magic !== MAGIC) return null;
  const view = new DataView(packed.buffer, packed.byteOffset, packed.byteLength);
  const bits = view.getUint32(MAGIC.length);
  const length = Math.floor(bits / 8);
  const start = MAGIC.length + 4;
  if (!length || length > 2_000_000 || start + length > packed.length) return null;
  return packed.subarray(start, start + length);
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const copy = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copy).set(bytes);
    const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

export async function readStealthRgba(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number): Promise<NaiInfo | null> {
  const payload = stealthPayload(rgba, width, height);
  if (!payload) return null;
  const raw = await gunzip(payload);
  if (!raw) return null;
  return parseComment(new TextDecoder("utf-8", { fatal: false }).decode(raw));
}

export async function readStealth(file: Blob): Promise<NaiInfo | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    return null;
  }
  context.drawImage(bitmap, 0, 0);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  const image = context.getImageData(0, 0, width, height);
  return readStealthRgba(image.data, width, height);
}
