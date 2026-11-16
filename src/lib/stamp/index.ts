import { jpegImageTail, jpegTimeProblem, readJpegTime, splitJpeg, stampJpeg } from "./jpeg.ts";
import { pngIdat, pngTimeProblem, readPngTime, stampPng } from "./png.ts";
import { readWebpTime, stampWebp, webpImage, webpProblem, webpTimeProblem } from "./webp.ts";

export type Kind = "jpeg" | "png" | "webp";

export type Inspect =
  | { image: true; ok: true; kind: Kind }
  | { image: true; ok: false; reason: string }
  | { image: false; ok: false; reason: string };

function brand(bytes: Uint8Array): string {
  if (bytes.length < 12) return "";
  return String.fromCharCode(...bytes.subarray(8, 12)).toLowerCase();
}

export function inspect(bytes: Uint8Array): Inspect {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return splitJpeg(bytes) ? { image: true, ok: true, kind: "jpeg" } : { image: true, ok: false, reason: "文件已损坏" };
  }
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    return pngIdat(bytes) ? { image: true, ok: true, kind: "png" } : { image: true, ok: false, reason: "文件已损坏" };
  }
  if (bytes.length >= 12 && String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" && String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP") {
    const problem = webpProblem(bytes);
    return problem ? { image: true, ok: false, reason: problem } : { image: true, ok: true, kind: "webp" };
  }
  if (bytes.length >= 6 && (String.fromCharCode(...bytes.subarray(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.subarray(0, 6)) === "GIF89a")) {
    return { image: true, ok: false, reason: "GIF，写不进拍摄时间" };
  }
  const ftyp = bytes.length > 12 && String.fromCharCode(...bytes.subarray(4, 8)) === "ftyp";
  const mark = ftyp ? brand(bytes) : "";
  if (ftyp && (mark.startsWith("hei") || mark.startsWith("mif") || mark === "heic" || mark === "heix")) {
    return { image: true, ok: false, reason: "HEIC，写不进拍摄时间" };
  }
  if (ftyp && mark.startsWith("avi")) return { image: true, ok: false, reason: "AVIF，写不进拍摄时间" };
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return { image: true, ok: false, reason: "这种格式写不进拍摄时间" };
  }
  return { image: false, ok: false, reason: "不是图片" };
}

export function stamp(bytes: Uint8Array, ms: number): Uint8Array {
  const info = inspect(bytes);
  if (!info.ok) throw new Error(info.reason);
  if (info.kind === "jpeg") return stampJpeg(bytes, ms);
  if (info.kind === "png") return stampPng(bytes, ms);
  return stampWebp(bytes, ms);
}

export function timeProblem(bytes: Uint8Array, ms: number): string | null {
  const info = inspect(bytes);
  if (!info.ok) return info.image ? info.reason : "读不出拍摄时间";
  if (info.kind === "jpeg") return jpegTimeProblem(bytes, ms);
  if (info.kind === "png") return pngTimeProblem(bytes, ms);
  return webpTimeProblem(bytes, ms);
}

export function readOriginalTime(bytes: Uint8Array, fallback: number): number {
  const info = inspect(bytes);
  if (info.ok && info.kind === "jpeg") return readJpegTime(bytes) ?? fallback;
  if (info.ok && info.kind === "png") return readPngTime(bytes) ?? fallback;
  if (info.image && bytes.length >= 12 && String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP") {
    return readWebpTime(bytes) ?? fallback;
  }
  return fallback;
}

export function imagePayload(bytes: Uint8Array): Uint8Array | null {
  return jpegImageTail(bytes) ?? pngIdat(bytes) ?? webpImage(bytes);
}
