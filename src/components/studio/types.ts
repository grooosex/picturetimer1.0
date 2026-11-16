import type { NaiInfo } from "@/lib/nai/read";

export type Photo = {
  id: string;
  name: string;
  file: Blob;
  thumb: string;
  originalTime: number;
  seq: number;
  reason: string | null;
  ext: "jpg" | "png" | "webp";
  meta?: NaiInfo | null;
  stealth?: boolean;
};

export const MAX_PHOTOS = 200;
