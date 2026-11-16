import assert from "node:assert/strict";
import test from "node:test";
import zlib from "node:zlib";
import { imagePayload, inspect, readOriginalTime, stamp } from "./index.ts";
import { crc32, sameBytes } from "./binary.ts";

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let index = 0; index < 4; index += 1) out[4 + index] = type.charCodeAt(index);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function png(): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 1);
  view.setUint32(4, 1);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = zlib.deflateSync(Uint8Array.of(0, 12, 34, 56));
  const sig = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", new Uint8Array())]);
}

function jpeg(): Uint8Array {
  const app0 = Uint8Array.of(
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  );
  const entropy = Uint8Array.of(0x11, 0x22, 0x33, 0x44, 0x55);
  const sos = Uint8Array.of(0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00);
  return Buffer.concat([Uint8Array.of(0xff, 0xd8), app0, sos, entropy, Uint8Array.of(0xff, 0xd9)]);
}

function webp(): Uint8Array {
  const vp8 = new Uint8Array(16);
  vp8[3] = 0x9d;
  vp8[4] = 0x01;
  vp8[5] = 0x2a;
  vp8[6] = 16;
  vp8[8] = 16;
  vp8[15] = 0x7e;
  const header = new Uint8Array(20);
  header.set([0x52, 0x49, 0x46, 0x46], 0);
  new DataView(header.buffer).setUint32(4, 12 + vp8.length, true);
  header.set([0x57, 0x45, 0x42, 0x50], 8);
  header.set([0x56, 0x50, 0x38, 0x20], 12);
  new DataView(header.buffer).setUint32(16, vp8.length, true);
  return Buffer.concat([header, vp8]);
}

test("png stamp keeps IDAT and round-trips the time", () => {
  const source = png();
  const when = new Date(2026, 9, 26, 10, 33, 7, 250).getTime();
  const out = stamp(source, when);
  assert.ok(imagePayload(source));
  assert.equal(sameBytes(imagePayload(out)!, imagePayload(source)!), true);
  assert.equal(readOriginalTime(out, 0), when);
  assert.equal(inspect(out).ok, true);
});

test("jpeg stamp keeps the compressed tail", () => {
  const source = jpeg();
  const when = new Date(2024, 0, 2, 3, 4, 5, 6).getTime();
  const out = stamp(source, when);
  assert.equal(sameBytes(imagePayload(out)!, imagePayload(source)!), true);
  assert.equal(readOriginalTime(out, 0), when);
});

test("webp stamp keeps the image chunk", () => {
  const source = webp();
  const when = new Date(2026, 4, 1, 8, 0, 0, 10).getTime();
  const out = stamp(source, when);
  assert.equal(sameBytes(imagePayload(out)!, imagePayload(source)!), true);
  assert.equal(readOriginalTime(out, 0), when);
});

test("gif is an image but cannot be stamped", () => {
  const gif = Uint8Array.from("GIF89a", (char) => char.charCodeAt(0));
  const info = inspect(gif);
  assert.equal(info.image, true);
  assert.equal(info.ok, false);
});
