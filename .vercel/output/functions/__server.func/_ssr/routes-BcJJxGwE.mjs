import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as RotateCcw, c as FolderOpen, i as ScanText, l as ChevronUp, o as Images, r as Trash2, s as Folder, t as X, u as ChevronDown } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BcJJxGwE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DB_NAME = "shixu";
var STORE = "kv";
var DIR_KEY = "dir";
function openDb() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
async function rememberDir(dir) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(dir, DIR_KEY);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}
async function loadDir() {
	const db = await openDb();
	const value = await new Promise((resolve, reject) => {
		const request = db.transaction(STORE, "readonly").objectStore(STORE).get(DIR_KEY);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	db.close();
	if (!value || typeof value !== "object" || !("kind" in value) || value.kind !== "directory") return null;
	return value;
}
function concat(parts) {
	let length = 0;
	for (const part of parts) length += part.length;
	const out = new Uint8Array(length);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}
function sameBytes(a, b) {
	if (a.length !== b.length) return false;
	for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return false;
	return true;
}
function startsWith(bytes, text, offset = 0) {
	if (offset + text.length > bytes.length) return false;
	for (let index = 0; index < text.length; index += 1) if (bytes[offset + index] !== text.charCodeAt(index)) return false;
	return true;
}
var CRC_TABLE = (() => {
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let index = 0; index < 256; index += 1) {
		let c = index;
		for (let bit = 0; bit < 8; bit += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		table[index] = c >>> 0;
	}
	return table;
})();
function crc32(bytes) {
	let c = 4294967295;
	for (let index = 0; index < bytes.length; index += 1) c = CRC_TABLE[(c ^ bytes[index]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
function viewOf(bytes) {
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
function exifClock(ms) {
	const date = new Date(ms);
	const p = (value) => String(value).padStart(2, "0");
	const y = date.getFullYear();
	const m = p(date.getMonth() + 1);
	const d = p(date.getDate());
	const h = p(date.getHours());
	const min = p(date.getMinutes());
	const s = p(date.getSeconds());
	return {
		date: `${y}:${m}:${d} ${h}:${min}:${s}`,
		sub: p(date.getMilliseconds()).padStart(3, "0").slice(0, 3),
		iso: `${y}-${m}-${d}T${h}:${min}:${s}`
	};
}
function parseExifLocal(date, sub) {
	const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(date);
	if (!match) return null;
	const ms = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])).getTime();
	if (!Number.isFinite(ms)) return null;
	const digits = (sub ?? "").replace(/\D/g, "");
	const extra = digits ? Number(digits.padEnd(3, "0").slice(0, 3)) : 0;
	return ms + (Number.isFinite(extra) ? extra : 0);
}
var DATE_RE = /(\d{4})([-:])(\d{2})\2(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/g;
function clockOf(found, wall, exifWall) {
	if (found[4] === ":") return exifWall;
	if (found[10] === "T") return wall;
	return `${wall.slice(0, 10)} ${wall.slice(11)}`;
}
function hasDate(data) {
	const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
	return new RegExp(DATE_RE.source).test(text);
}
function wrongDate(data, wall, exifWall) {
	const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
	const re = new RegExp(DATE_RE.source, "g");
	let match;
	while (match = re.exec(text)) {
		const found = match[0];
		if (found !== clockOf(found, wall, exifWall)) return found;
	}
	return null;
}
var TAG_ORIENTATION = 274;
var TAG_DATETIME = 306;
var TAG_EXIF_IFD = 34665;
var TAG_ORIGINAL = 36867;
var TAG_DIGITIZED = 36868;
var TAG_SUB = 37520;
var TAG_SUB_ORIGINAL = 37521;
var TAG_SUB_DIGITIZED = 37522;
function asciiBytes(text, size) {
	const out = new Uint8Array(size);
	for (let index = 0; index < text.length && index < size - 1; index += 1) out[index] = text.charCodeAt(index);
	return out;
}
function buildTiff(date, sub, orientation) {
	const includeOrientation = orientation != null && orientation >= 1 && orientation <= 8;
	const ifd0Tags = includeOrientation ? 3 : 2;
	const ifd0Size = 2 + ifd0Tags * 12 + 4;
	const dateBytes = asciiBytes(date, 20);
	const subBytes = asciiBytes(sub, 4);
	const exifCount = 5;
	const exifSize = 66;
	const dateAt = 8 + ifd0Size;
	const originalAt = dateAt + 20;
	const digitizedAt = originalAt + 20;
	const exifAt = digitizedAt + 20;
	const total = exifAt + exifSize;
	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);
	out[0] = 73;
	out[1] = 73;
	view.setUint16(2, 42, true);
	view.setUint32(4, 8, true);
	let cursor = 8;
	view.setUint16(cursor, ifd0Tags, true);
	cursor += 2;
	const writeEntry = (tag, type, count, value, inline) => {
		view.setUint16(cursor, tag, true);
		view.setUint16(cursor + 2, type, true);
		view.setUint32(cursor + 4, count, true);
		if (inline) out.set(inline.subarray(0, 4), cursor + 8);
		else view.setUint32(cursor + 8, value, true);
		cursor += 12;
	};
	if (includeOrientation) writeEntry(TAG_ORIENTATION, 3, 1, orientation);
	writeEntry(TAG_DATETIME, 2, 20, dateAt);
	writeEntry(TAG_EXIF_IFD, 4, 1, exifAt);
	view.setUint32(cursor, 0, true);
	out.set(dateBytes, dateAt);
	out.set(dateBytes, originalAt);
	out.set(dateBytes, digitizedAt);
	cursor = exifAt;
	view.setUint16(cursor, exifCount, true);
	cursor += 2;
	writeEntry(TAG_ORIGINAL, 2, 20, originalAt);
	writeEntry(TAG_DIGITIZED, 2, 20, digitizedAt);
	writeEntry(TAG_SUB, 2, 4, 0, subBytes);
	writeEntry(TAG_SUB_ORIGINAL, 2, 4, 0, subBytes);
	writeEntry(TAG_SUB_DIGITIZED, 2, 4, 0, subBytes);
	view.setUint32(cursor, 0, true);
	return out;
}
function readIfd(bytes, offset, little) {
	const view = viewOf(bytes);
	if (offset < 0 || offset + 2 > bytes.length) return [];
	const count = view.getUint16(offset, little);
	const entries = [];
	for (let index = 0; index < count; index += 1) {
		const cursor = offset + 2 + index * 12;
		if (cursor + 12 > bytes.length) break;
		const tag = view.getUint16(cursor, little);
		const type = view.getUint16(cursor + 2, little);
		const size = view.getUint32(cursor + 4, little);
		const raw = view.getUint32(cursor + 8, little);
		entries.push({
			tag,
			type,
			count: size,
			valueOffset: cursor + 8,
			raw
		});
	}
	return entries;
}
function entryText(bytes, entry, little) {
	const width = entry.type === 2 ? 1 : entry.type === 3 ? 2 : entry.type === 4 ? 4 : 1;
	const bytesNeeded = entry.count * width;
	let start = entry.valueOffset;
	if (bytesNeeded > 4) {
		const view = viewOf(bytes);
		start = little ? view.getUint32(entry.valueOffset, true) : view.getUint32(entry.valueOffset, false);
	}
	if (start < 0 || start + entry.count > bytes.length) return "";
	let text = "";
	for (let index = 0; index < entry.count; index += 1) {
		const code = bytes[start + index];
		if (code === 0) break;
		text += String.fromCharCode(code);
	}
	return text;
}
function readTiffTime(bytes) {
	if (bytes.length < 8) return null;
	const little = bytes[0] === 73 && bytes[1] === 73;
	const big = bytes[0] === 77 && bytes[1] === 77;
	if (!little && !big) return null;
	const view = viewOf(bytes);
	const ifd0 = readIfd(bytes, view.getUint32(4, little), little);
	let orientation;
	let date = "";
	let sub = "";
	let exifAt = 0;
	for (const entry of ifd0) if (entry.tag === TAG_ORIENTATION && entry.type === 3) orientation = little ? view.getUint16(entry.valueOffset, true) : view.getUint16(entry.valueOffset, false);
	else if (entry.tag === TAG_DATETIME) date = entryText(bytes, entry, little);
	else if (entry.tag === TAG_EXIF_IFD) exifAt = entry.raw;
	if (exifAt) {
		const exif = readIfd(bytes, exifAt, little);
		let original = "";
		let digitized = "";
		let subOriginal = "";
		for (const entry of exif) if (entry.tag === TAG_ORIGINAL) original = entryText(bytes, entry, little);
		else if (entry.tag === TAG_DIGITIZED) digitized = entryText(bytes, entry, little);
		else if (entry.tag === TAG_SUB_ORIGINAL) subOriginal = entryText(bytes, entry, little);
		else if (entry.tag === TAG_SUB && !sub) sub = entryText(bytes, entry, little);
		const ms = parseExifLocal(original || digitized || date, subOriginal || sub);
		if (ms != null) return {
			ms,
			orientation
		};
	}
	const ms = parseExifLocal(date, sub);
	if (ms == null) return orientation ? {
		ms: NaN,
		orientation
	} : null;
	return {
		ms,
		orientation
	};
}
function readOrientation(bytes) {
	return readTiffTime(bytes)?.orientation;
}
var EXIF_HEADER = "Exif\0\0";
var XMP_HEADER = "http://ns.adobe.com/xap/1.0/\0";
function splitJpeg(bytes) {
	if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return null;
	const segments = [];
	let index = 2;
	while (index + 1 < bytes.length) {
		if (bytes[index] !== 255) return null;
		while (index < bytes.length && bytes[index] === 255) index += 1;
		if (index >= bytes.length) return null;
		const markerStart = index - 1;
		const marker = bytes[index];
		index += 1;
		if (marker === 218) return {
			segments,
			tail: bytes.subarray(markerStart)
		};
		if (marker === 217) return null;
		if (marker === 1 || marker >= 208 && marker <= 215) {
			segments.push({
				marker,
				payload: /* @__PURE__ */ new Uint8Array()
			});
			continue;
		}
		if (index + 2 > bytes.length) return null;
		const length = bytes[index] << 8 | bytes[index + 1];
		if (length < 2 || index + length > bytes.length) return null;
		segments.push({
			marker,
			payload: bytes.subarray(index + 2, index + length)
		});
		index += length;
	}
	return null;
}
function isExif(segment) {
	return segment.marker === 225 && startsWith(segment.payload, EXIF_HEADER);
}
function encodeSegment(segment) {
	if (segment.payload.length === 0 && (segment.marker === 1 || segment.marker >= 208 && segment.marker <= 215)) return Uint8Array.of(255, segment.marker);
	const length = segment.payload.length + 2;
	return concat([Uint8Array.of(255, segment.marker, length >> 8 & 255, length & 255), segment.payload]);
}
function jpegImageTail(bytes) {
	return splitJpeg(bytes)?.tail ?? null;
}
function stampJpeg(bytes, ms) {
	const split = splitJpeg(bytes);
	if (!split) throw new Error("文件已损坏");
	const clock = exifClock(ms);
	let orientation;
	for (const segment of split.segments) {
		if (!isExif(segment)) continue;
		orientation = readOrientation(segment.payload.subarray(6));
		break;
	}
	const tiff = buildTiff(clock.date, clock.sub, orientation);
	const header = /* @__PURE__ */ new Uint8Array(6);
	for (let index = 0; index < 6; index += 1) header[index] = EXIF_HEADER.charCodeAt(index);
	const exif = {
		marker: 225,
		payload: concat([header, tiff])
	};
	const kept = [];
	for (const segment of split.segments) {
		if (isExif(segment)) continue;
		if (segment.marker === 225 && startsWith(segment.payload, XMP_HEADER)) {
			if (!hasDate(segment.payload)) kept.push(segment);
			continue;
		}
		if (segment.marker === 254) {
			if (!hasDate(segment.payload)) kept.push(segment);
			continue;
		}
		kept.push(segment);
	}
	const app0 = kept.findIndex((segment) => segment.marker === 224);
	kept.splice(app0 >= 0 ? app0 + 1 : 0, 0, exif);
	const out = concat([
		Uint8Array.of(255, 216),
		...kept.map(encodeSegment),
		split.tail
	]);
	const check = jpegImageTail(out);
	if (!check || !sameBytes(check, split.tail)) throw new Error("画面校验失败");
	return out;
}
function readJpegTime(bytes) {
	const split = splitJpeg(bytes);
	if (!split) return null;
	for (const segment of split.segments) {
		if (!isExif(segment)) continue;
		const found = readTiffTime(segment.payload.subarray(6));
		if (found && Number.isFinite(found.ms)) return found.ms;
	}
	return null;
}
function jpegTimeProblem(bytes, ms) {
	const clock = exifClock(ms);
	const found = readJpegTime(bytes);
	if (found !== ms) return found == null ? "读不出拍摄时间" : `时间不对，写成了 ${exifClock(found).iso.replace("T", " ")}`;
	const split = splitJpeg(bytes);
	if (!split) return "读不出拍摄时间";
	for (const segment of split.segments) {
		if (!(segment.marker === 225 && startsWith(segment.payload, XMP_HEADER)) && segment.marker !== 254) continue;
		if (hasDate(segment.payload)) return "还有旧时间没去掉";
		const stale = wrongDate(segment.payload, clock.iso, clock.date);
		if (stale) return `还有旧时间 ${stale}`;
	}
	return null;
}
var SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
function encodeChunk(type, data) {
	const out = new Uint8Array(12 + data.length);
	const view = new DataView(out.buffer);
	view.setUint32(0, data.length);
	for (let index = 0; index < 4; index += 1) out[4 + index] = type.charCodeAt(index);
	out.set(data, 8);
	view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
	return out;
}
function readPngChunks(bytes) {
	if (bytes.length < 8) return null;
	for (let index = 0; index < 8; index += 1) if (bytes[index] !== SIGNATURE[index]) return null;
	const view = viewOf(bytes);
	const chunks = [];
	let offset = 8;
	while (offset + 12 <= bytes.length) {
		const length = view.getUint32(offset);
		const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
		const end = offset + 12 + length;
		if (length < 0 || end > bytes.length) return null;
		chunks.push({
			type,
			data: bytes.subarray(offset + 8, offset + 8 + length),
			raw: bytes.subarray(offset, end)
		});
		offset = end;
		if (type === "IEND") return offset === bytes.length ? chunks : chunks;
	}
	return null;
}
function pngIdat(bytes) {
	const chunks = readPngChunks(bytes);
	if (!chunks?.some((chunk) => chunk.type === "IDAT") || !chunks.some((chunk) => chunk.type === "IEND")) return null;
	return concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data));
}
function tIme(ms) {
	const date = new Date(ms);
	const data = /* @__PURE__ */ new Uint8Array(7);
	new DataView(data.buffer).setUint16(0, date.getFullYear());
	data[2] = date.getMonth() + 1;
	data[3] = date.getDate();
	data[4] = date.getHours();
	data[5] = date.getMinutes();
	data[6] = date.getSeconds();
	return data;
}
function compressedText(type, data) {
	if (type === "zTXt") return true;
	if (type !== "iTXt") return false;
	const zero = data.indexOf(0);
	return zero < 0 || zero + 1 >= data.length || data[zero + 1] !== 0;
}
function stampPng(bytes, ms) {
	const chunks = readPngChunks(bytes);
	const before = pngIdat(bytes);
	if (!chunks || !before || !chunks.some((chunk) => chunk.type === "IHDR")) throw new Error("文件已损坏");
	const clock = exifClock(ms);
	const tiff = buildTiff(clock.date, clock.sub);
	const parts = [bytes.subarray(0, 8)];
	let inserted = false;
	const timeChunks = [encodeChunk("tIME", tIme(ms)), encodeChunk("eXIf", tiff)];
	for (const chunk of chunks) {
		if (chunk.type === "tIME" || chunk.type === "eXIf") continue;
		if (chunk.type === "iTXt" || chunk.type === "tEXt" || chunk.type === "zTXt") {
			if (compressedText(chunk.type, chunk.data) || hasDate(chunk.data)) continue;
			parts.push(chunk.raw);
			continue;
		}
		if (!inserted && (chunk.type === "IDAT" || chunk.type === "IEND")) {
			parts.push(...timeChunks);
			inserted = true;
		}
		parts.push(chunk.raw);
	}
	if (!inserted) throw new Error("文件已损坏");
	const out = concat(parts);
	const after = pngIdat(out);
	if (!after || !sameBytes(before, after)) throw new Error("画面校验失败");
	return out;
}
function readPngTime(bytes) {
	const chunks = readPngChunks(bytes);
	if (!chunks) return null;
	for (const chunk of chunks) {
		if (chunk.type !== "eXIf") continue;
		const found = readTiffTime(chunk.data[0] === 69 && chunk.data[1] === 120 ? chunk.data.subarray(6) : chunk.data);
		if (found && Number.isFinite(found.ms)) return found.ms;
	}
	for (const chunk of chunks) {
		if (chunk.type !== "tIME" || chunk.data.length < 7) continue;
		const view = viewOf(chunk.data);
		const ms = new Date(view.getUint16(0), chunk.data[2] - 1, chunk.data[3], chunk.data[4], chunk.data[5], chunk.data[6]).getTime();
		if (Number.isFinite(ms)) return ms;
	}
	return null;
}
function pngTimeProblem(bytes, ms) {
	const clock = exifClock(ms);
	const found = readPngTime(bytes);
	if (found !== ms) return found == null ? "读不出拍摄时间" : `时间不对，写成了 ${exifClock(found).iso.replace("T", " ")}`;
	const chunks = readPngChunks(bytes);
	if (!chunks) return "读不出拍摄时间";
	let seenImage = false;
	let timeBefore = false;
	for (const chunk of chunks) {
		if (chunk.type === "IDAT") seenImage = true;
		if (chunk.type === "tIME" || chunk.type === "eXIf") {
			if (seenImage) return "时间还在画面后面";
			timeBefore = true;
		}
		if (chunk.type === "tIME" && chunk.data.length >= 7) {
			const wall = `${viewOf(chunk.data).getUint16(0)}-${String(chunk.data[2]).padStart(2, "0")}-${String(chunk.data[3]).padStart(2, "0")}T${String(chunk.data[4]).padStart(2, "0")}:${String(chunk.data[5]).padStart(2, "0")}:${String(chunk.data[6]).padStart(2, "0")}`;
			if (wall !== clock.iso) return `时间不对，写成了 ${wall.replace("T", " ")}`;
		}
		if (chunk.type !== "tEXt" && chunk.type !== "iTXt" && chunk.type !== "zTXt") continue;
		if (compressedText(chunk.type, chunk.data) || hasDate(chunk.data)) return "还有旧时间没去掉";
		const stale = wrongDate(chunk.data, clock.iso, clock.date);
		if (stale) return `还有旧时间 ${stale}`;
	}
	if (!timeBefore) return "时间没写在画面前面";
	return null;
}
var EXIF_FLAG = 8;
var ALPHA_FLAG = 16;
var ANIM_FLAG = 2;
function readChunks(bytes) {
	if (bytes.length < 12) return null;
	if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[8], bytes[9], bytes[10], bytes[11]) !== "RIFFWEBP") return null;
	const view = viewOf(bytes);
	const chunks = [];
	let offset = 12;
	while (offset + 8 <= bytes.length) {
		const type = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
		const size = view.getUint32(offset + 4, true);
		const end = offset + 8 + size;
		if (end > bytes.length) return null;
		chunks.push({
			type,
			data: bytes.subarray(offset + 8, end)
		});
		offset = end + (size & 1);
	}
	return chunks;
}
function encode(chunks) {
	let payload = 4;
	for (const chunk of chunks) payload += 8 + chunk.data.length + (chunk.data.length & 1);
	const out = new Uint8Array(8 + payload);
	out.set([
		82,
		73,
		70,
		70
	], 0);
	viewOf(out).setUint32(4, payload, true);
	out.set([
		87,
		69,
		66,
		80
	], 8);
	let offset = 12;
	for (const chunk of chunks) {
		for (let index = 0; index < 4; index += 1) out[offset + index] = chunk.type.charCodeAt(index);
		viewOf(out).setUint32(offset + 4, chunk.data.length, true);
		out.set(chunk.data, offset + 8);
		offset += 8 + chunk.data.length;
		if (chunk.data.length & 1) offset += 1;
	}
	return out;
}
function vp8Size(data) {
	if (data.length < 10 || data[3] !== 157 || data[4] !== 1 || data[5] !== 42) return null;
	return {
		w: (data[6] | data[7] << 8) & 16383,
		h: (data[8] | data[9] << 8) & 16383
	};
}
function vp8lSize(data) {
	if (data.length < 5 || data[0] !== 47) return null;
	const bits = data[1] | data[2] << 8 | data[3] << 16 | data[4] << 24;
	return {
		w: (bits & 16383) + 1,
		h: (bits >>> 14 & 16383) + 1
	};
}
function makeVp8x(width, height, flags) {
	const data = /* @__PURE__ */ new Uint8Array(10);
	data[0] = flags;
	const w = width - 1;
	const h = height - 1;
	data[4] = w & 255;
	data[5] = w >> 8 & 255;
	data[6] = w >> 16 & 255;
	data[7] = h & 255;
	data[8] = h >> 8 & 255;
	data[9] = h >> 16 & 255;
	return data;
}
function webpImage(bytes) {
	const image = readChunks(bytes)?.find((chunk) => chunk.type === "VP8 " || chunk.type === "VP8L");
	return image ? image.data : null;
}
function webpProblem(bytes) {
	const chunks = readChunks(bytes);
	if (!chunks) return "文件已损坏";
	if (chunks.some((chunk) => chunk.type === "ANMF" || chunk.type === "ANIM")) return "动图，写不进拍摄时间";
	const vp8x = chunks.find((chunk) => chunk.type === "VP8X");
	if (vp8x && vp8x.data[0] & ANIM_FLAG) return "动图，写不进拍摄时间";
	const image = chunks.find((chunk) => chunk.type === "VP8 " || chunk.type === "VP8L");
	if (!image) return "文件已损坏";
	if (!(image.type === "VP8 " ? vp8Size(image.data) : vp8lSize(image.data)) && !vp8x) return "文件已损坏";
	return null;
}
function stampWebp(bytes, ms) {
	const problem = webpProblem(bytes);
	if (problem) throw new Error(problem);
	const chunks = readChunks(bytes);
	const before = webpImage(bytes);
	const clock = exifClock(ms);
	const exif = {
		type: "EXIF",
		data: buildTiff(clock.date, clock.sub)
	};
	const image = chunks.find((chunk) => chunk.type === "VP8 " || chunk.type === "VP8L");
	const size = image.type === "VP8 " ? vp8Size(image.data) : vp8lSize(image.data);
	const alpha = chunks.some((chunk) => chunk.type === "ALPH");
	const next = [];
	let hasVp8x = false;
	for (const chunk of chunks) {
		if (chunk.type === "EXIF" || chunk.type === "XMP ") continue;
		if (chunk.type === "VP8X") {
			const data = new Uint8Array(chunk.data);
			data[0] |= EXIF_FLAG;
			next.push({
				type: "VP8X",
				data
			});
			hasVp8x = true;
			continue;
		}
		next.push(chunk);
	}
	if (!hasVp8x) {
		if (!size) throw new Error("文件已损坏");
		next.unshift({
			type: "VP8X",
			data: makeVp8x(size.w, size.h, EXIF_FLAG | (alpha ? ALPHA_FLAG : 0))
		});
	}
	next.push(exif);
	const xmp = chunks.find((chunk) => chunk.type === "XMP ");
	if (xmp && !hasDate(xmp.data)) next.push(xmp);
	const out = encode(next);
	const after = webpImage(out);
	if (!after || !sameBytes(before, after)) throw new Error("画面校验失败");
	return out;
}
function readWebpTime(bytes) {
	const exif = readChunks(bytes)?.find((chunk) => chunk.type === "EXIF");
	if (!exif) return null;
	const found = readTiffTime(exif.data[0] === 69 && exif.data[1] === 120 ? exif.data.subarray(6) : exif.data);
	return found && Number.isFinite(found.ms) ? found.ms : null;
}
function webpTimeProblem(bytes, ms) {
	const found = readWebpTime(bytes);
	if (found !== ms) return found == null ? "读不出拍摄时间" : `时间不对，写成了 ${exifClock(found).iso.replace("T", " ")}`;
	const xmp = readChunks(bytes)?.find((chunk) => chunk.type === "XMP ");
	if (!xmp) return null;
	return hasDate(xmp.data) ? "还有旧时间没去掉" : null;
}
function brand(bytes) {
	if (bytes.length < 12) return "";
	return String.fromCharCode(...bytes.subarray(8, 12)).toLowerCase();
}
function inspect(bytes) {
	if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return splitJpeg(bytes) ? {
		image: true,
		ok: true,
		kind: "jpeg"
	} : {
		image: true,
		ok: false,
		reason: "文件已损坏"
	};
	if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return pngIdat(bytes) ? {
		image: true,
		ok: true,
		kind: "png"
	} : {
		image: true,
		ok: false,
		reason: "文件已损坏"
	};
	if (bytes.length >= 12 && String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" && String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP") {
		const problem = webpProblem(bytes);
		return problem ? {
			image: true,
			ok: false,
			reason: problem
		} : {
			image: true,
			ok: true,
			kind: "webp"
		};
	}
	if (bytes.length >= 6 && (String.fromCharCode(...bytes.subarray(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.subarray(0, 6)) === "GIF89a")) return {
		image: true,
		ok: false,
		reason: "GIF，写不进拍摄时间"
	};
	const ftyp = bytes.length > 12 && String.fromCharCode(...bytes.subarray(4, 8)) === "ftyp";
	const mark = ftyp ? brand(bytes) : "";
	if (ftyp && (mark.startsWith("hei") || mark.startsWith("mif") || mark === "heic" || mark === "heix")) return {
		image: true,
		ok: false,
		reason: "HEIC，写不进拍摄时间"
	};
	if (ftyp && mark.startsWith("avi")) return {
		image: true,
		ok: false,
		reason: "AVIF，写不进拍摄时间"
	};
	if (bytes.length >= 2 && bytes[0] === 66 && bytes[1] === 77) return {
		image: true,
		ok: false,
		reason: "这种格式写不进拍摄时间"
	};
	return {
		image: false,
		ok: false,
		reason: "不是图片"
	};
}
function stamp(bytes, ms) {
	const info = inspect(bytes);
	if (!info.ok) throw new Error(info.reason);
	if (info.kind === "jpeg") return stampJpeg(bytes, ms);
	if (info.kind === "png") return stampPng(bytes, ms);
	return stampWebp(bytes, ms);
}
function timeProblem(bytes, ms) {
	const info = inspect(bytes);
	if (!info.ok) return info.image ? info.reason : "读不出拍摄时间";
	if (info.kind === "jpeg") return jpegTimeProblem(bytes, ms);
	if (info.kind === "png") return pngTimeProblem(bytes, ms);
	return webpTimeProblem(bytes, ms);
}
function readOriginalTime(bytes, fallback) {
	const info = inspect(bytes);
	if (info.ok && info.kind === "jpeg") return readJpegTime(bytes) ?? fallback;
	if (info.ok && info.kind === "png") return readPngTime(bytes) ?? fallback;
	if (info.image && bytes.length >= 12 && String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP") return readWebpTime(bytes) ?? fallback;
	return fallback;
}
function touchOwned(owned, field) {
	return [...owned.filter((item) => item !== field), field].slice(-2);
}
function failed(message, owned) {
	return {
		startMs: 0,
		endMs: 0,
		intervalMs: 0,
		times: [],
		error: message,
		autoStart: !owned.includes("start"),
		autoEnd: !owned.includes("end"),
		autoInterval: !owned.includes("interval"),
		usesNow: false
	};
}
function computePlan(input) {
	const { n, now, owned } = input;
	const autoStart = !owned.includes("start");
	const autoEnd = !owned.includes("end");
	const autoInterval = !owned.includes("interval");
	if (owned.includes("interval") && (input.intervalMs == null || input.intervalMs <= 0)) return failed("间隔要大于 0", owned);
	if (owned.includes("start") && input.startMs == null) return failed("开始时间不完整", owned);
	if (owned.includes("end") && input.endMs == null) return failed("结束时间不完整", owned);
	if (n <= 0) return failed("没有图片", owned);
	const hasS = owned.includes("start");
	const hasE = owned.includes("end");
	const hasI = owned.includes("interval");
	const usesNow = !hasS && !hasE;
	if (n === 1) {
		if (hasS && hasE && input.startMs !== input.endMs) return failed("只有一张，开始和结束要相同", owned);
		const t = hasE ? input.endMs : hasS ? input.startMs : now;
		return {
			startMs: t,
			endMs: t,
			intervalMs: hasI ? input.intervalMs : 1e3,
			times: [t],
			error: null,
			autoStart,
			autoEnd,
			autoInterval,
			usesNow
		};
	}
	let start = hasS ? input.startMs : 0;
	let end = hasE ? input.endMs : 0;
	let interval = hasI ? input.intervalMs : 1e3;
	if (hasS && hasE) interval = (end - start) / (n - 1);
	else if (hasS && hasI) end = start + (n - 1) * interval;
	else if (hasE && hasI) start = end - (n - 1) * interval;
	else if (hasS) {
		interval = 1e3;
		end = start + (n - 1) * interval;
	} else if (hasE) {
		interval = 1e3;
		start = end - (n - 1) * interval;
	} else if (hasI) {
		end = now;
		start = end - (n - 1) * interval;
	} else {
		interval = 1e3;
		end = now;
		start = end - (n - 1) * interval;
	}
	if (!(end > start)) return failed("结束时间要晚于开始时间", owned);
	const times = Array.from({ length: n }, (_, index) => Math.round(end - (end - start) * index / (n - 1)));
	times[0] = Math.round(end);
	times[n - 1] = Math.round(start);
	for (let index = 0; index < times.length - 1; index += 1) if (times[index] <= times[index + 1]) return failed("间隔太小，有的图会落到同一毫秒", owned);
	return {
		startMs: times[n - 1],
		endMs: times[0],
		intervalMs: interval,
		times,
		error: null,
		autoStart,
		autoEnd,
		autoInterval,
		usesNow
	};
}
function formatClock(ms) {
	const date = new Date(ms);
	const p = (value) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}
function formatLocalInput(ms) {
	return formatClock(ms).replace(" ", "T");
}
function parseLocalInput(value) {
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hour = Number(match[4]);
	const minute = Number(match[5]);
	const second = Number(match[6] ?? "0");
	const date = new Date(year, month - 1, day, hour, minute, second);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== second) return null;
	return date.getTime();
}
function formatInterval(ms, unit) {
	const value = unit === "m" ? ms / 6e4 : ms / 1e3;
	if (!Number.isFinite(value)) return "";
	const rounded = Math.round(value * 1e3) / 1e3;
	return String(rounded);
}
function batchStamp(ms) {
	const date = new Date(ms);
	const p = (value, length = 2) => String(value).padStart(length, "0");
	return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}_${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}${p(date.getMilliseconds(), 3)}`;
}
var MODELS = {
	"nai-diffusion-4-5-full": "NAI V4.5 Full",
	"nai-diffusion-4-5-curated": "NAI V4.5 Curated",
	"nai-diffusion-4-full": "NAI V4 Full",
	"nai-diffusion-4-curated": "NAI V4 Curated",
	"nai-diffusion-3": "NAI V3",
	"nai-diffusion-furry-3": "NAI Furry V3",
	"nai-diffusion-2": "NAI V2",
	"nai-diffusion": "NAI V1",
	"safe-diffusion": "NAI Safe"
};
var MAGIC = "stealth_pngcomp";
function modelLabel(model) {
	if (!model) return "—";
	return MODELS[model] ?? model;
}
function num(value) {
	if (typeof value === "number" && Number.isFinite(value)) return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
	if (typeof value === "string" && value.trim()) return value.trim();
	return "—";
}
function asRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value;
}
function characterLines(value) {
	const caption = asRecord(asRecord(value)?.caption);
	if (!caption) return null;
	const base = typeof caption.base_caption === "string" ? caption.base_caption : "";
	const chars = [];
	if (Array.isArray(caption.char_captions)) for (const item of caption.char_captions) {
		const text = asRecord(item);
		const line = text && typeof text.char_caption === "string" ? text.char_caption.trim() : "";
		if (line) chars.push(line);
	}
	return {
		base,
		chars
	};
}
function toInfo(raw) {
	let obj = raw;
	if (typeof obj.Comment === "string") try {
		const inner = asRecord(JSON.parse(obj.Comment));
		if (inner) obj = inner;
	} catch {
		return null;
	}
	else if (asRecord(obj.Comment)) obj = obj.Comment;
	const positiveV4 = characterLines(obj.v4_prompt);
	const negativeV4 = characterLines(obj.v4_negative_prompt);
	const fromPrompt = typeof obj.prompt === "string" ? obj.prompt : "";
	const fromUc = typeof obj.uc === "string" ? obj.uc : "";
	const positive = positiveV4?.base.trim() ? positiveV4.base : fromPrompt;
	const negative = negativeV4?.base.trim() ? negativeV4.base : fromUc;
	const characters = positiveV4?.chars ?? [];
	const model = typeof obj.model === "string" ? obj.model : "";
	if (!(model || positive || negative || characters.length || obj.steps != null || obj.seed != null || obj.scale != null)) return null;
	return {
		model: modelLabel(model),
		steps: num(obj.steps),
		seed: num(obj.seed),
		cfg: num(obj.scale),
		positive,
		negative,
		characters
	};
}
function parseComment(text) {
	const start = text.indexOf("{");
	if (start < 0) return null;
	try {
		const data = asRecord(JSON.parse(text.slice(start)));
		return data ? toInfo(data) : null;
	} catch {
		return null;
	}
}
function chunkText(type, data) {
	const decode = (bytes) => new TextDecoder("utf-8", { fatal: false }).decode(bytes);
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
function readTextMeta(bytes) {
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
function stealthPayload(rgba, width, height) {
	const pixels = width * height;
	if (pixels < 152 || rgba.length < pixels * 4) return null;
	const byteCount = Math.floor(pixels / 8);
	const packed = new Uint8Array(byteCount);
	let bit = 0;
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			const alpha = rgba[(y * width + x) * 4 + 3] & 1;
			packed[bit >> 3] |= alpha << 7 - (bit & 7);
			bit += 1;
			if (bit >= byteCount * 8) break;
		}
		if (bit >= byteCount * 8) break;
	}
	if (new TextDecoder().decode(packed.subarray(0, 15)) !== MAGIC) return null;
	const bits = new DataView(packed.buffer, packed.byteOffset, packed.byteLength).getUint32(15);
	const length = Math.floor(bits / 8);
	const start = 19;
	if (!length || length > 2e6 || start + length > packed.length) return null;
	return packed.subarray(start, start + length);
}
async function gunzip(bytes) {
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
async function readStealthRgba(rgba, width, height) {
	const payload = stealthPayload(rgba, width, height);
	if (!payload) return null;
	const raw = await gunzip(payload);
	if (!raw) return null;
	return parseComment(new TextDecoder("utf-8", { fatal: false }).decode(raw));
}
async function readStealth(file) {
	let bitmap;
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
	return readStealthRgba(context.getImageData(0, 0, width, height).data, width, height);
}
function ExportSheet({ open, photos, progress, onClose, onConfirm, onStop }) {
	const [anchor, setAnchor] = (0, import_react.useState)(() => Date.now());
	const [owned, setOwned] = (0, import_react.useState)([]);
	const [startText, setStartText] = (0, import_react.useState)("");
	const [endText, setEndText] = (0, import_react.useState)("");
	const [intervalText, setIntervalText] = (0, import_react.useState)("");
	const [unit, setUnit] = (0, import_react.useState)("s");
	const [strict, setStrict] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
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
	const plan = computePlan({
		n: photos.length,
		now: anchor,
		owned,
		startMs,
		endMs,
		intervalMs
	});
	const first = photos[0];
	const last = photos[photos.length - 1];
	const sample = batchStamp(anchor);
	function own(field) {
		const next = touchOwned(owned, field);
		setOwned(next);
		if (!next.includes("start")) setStartText("");
		if (!next.includes("end")) setEndText("");
		if (!next.includes("interval")) setIntervalText("");
	}
	function changeUnit(next) {
		if (owned.includes("interval")) {
			const ms = readInterval(intervalText, unit);
			if (ms != null) setIntervalText(formatInterval(ms, next));
		}
		setUnit(next);
	}
	const startValue = owned.includes("start") ? startText : plan.error ? "" : formatLocalInput(plan.startMs);
	const endValue = owned.includes("end") ? endText : plan.error ? "" : formatLocalInput(plan.endMs);
	const intervalValue = owned.includes("interval") ? intervalText : plan.error ? "" : formatInterval(plan.intervalMs, unit);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-40 bg-fg/40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "关闭",
			className: "absolute inset-0",
			onClick: () => {
				if (!progress) onClose();
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-card bg-surface px-4 pt-4 pb-safe text-fg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-3xl leading-none",
						children: "输出"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": strict,
						disabled: !!progress,
						onClick: () => setStrict((on) => !on),
						className: `h-8 rounded-full px-3 text-sm ${strict ? "bg-primary text-primary-fg" : "bg-surface ring-1 ring-line"}`,
						children: "强化"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "关闭",
					className: "flex h-11 w-11 items-center justify-center",
					onClick: () => {
						if (!progress) onClose();
					},
					disabled: !!progress,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 22,
						strokeWidth: 1.75
					})
				})]
			}), progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pb-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-lg",
						children: [
							"正在保存 ",
							progress.done,
							"/",
							progress.total
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "写进已选的文件夹。写完读出拍摄时间，必须正好隔开你定的间隔，才写下一张。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-5 h-12 w-full rounded-2xl ring-1 ring-line",
						onClick: onStop,
						children: "停止"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "开始时间",
					hint: "右下 · 最早",
					auto: plan.autoStart,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "datetime-local",
						step: 1,
						value: startValue,
						onChange: (event) => {
							own("start");
							setStartText(event.target.value);
						},
						className: `h-12 w-full rounded-xl px-3 text-base ring-1 ring-line ${plan.autoStart ? "bg-bg" : "bg-surface"}`
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "间隔",
					hint: "",
					auto: plan.autoInterval,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							inputMode: "decimal",
							value: intervalValue,
							onChange: (event) => {
								own("interval");
								setIntervalText(event.target.value);
							},
							className: `h-12 w-24 rounded-xl px-3 text-center text-base ring-1 ring-line ${plan.autoInterval ? "bg-bg" : "bg-surface"}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-12 flex-1 overflow-hidden rounded-xl ring-1 ring-line",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `flex-1 ${unit === "s" ? "bg-primary text-primary-fg" : "bg-surface"}`,
								onClick: () => changeUnit("s"),
								children: "秒"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `flex-1 ${unit === "m" ? "bg-primary text-primary-fg" : "bg-surface"}`,
								onClick: () => changeUnit("m"),
								children: "分钟"
							})]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "结束时间",
					hint: "左上 · 最新",
					auto: plan.autoEnd,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "datetime-local",
						step: 1,
						value: endValue,
						onChange: (event) => {
							own("end");
							setEndText(event.target.value);
						},
						className: `h-12 w-full rounded-xl px-3 text-base ring-1 ring-line ${plan.autoEnd ? "bg-bg" : "bg-surface"}`
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `mt-4 text-sm ${plan.error ? "text-primary" : "text-fg"}`,
					children: plan.error ? plan.error : `共 ${photos.length} 张，左上 ${formatClock(plan.endMs)}，右下 ${formatClock(plan.startMs)}，间隔 ${formatInterval(plan.intervalMs, unit)} ${unit === "m" ? "分钟" : "秒"}`
				}),
				plan.usesNow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "没填的时间，以按下确定的那一刻为准。"
				}) : null,
				first ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs break-all text-muted",
					children: [`ord_${sample}_001.${first.ext}`, last && photos.length > 1 ? ` 到 ord_${sample}_${String(photos.length).padStart(3, "0")}.${last.ext}` : ""]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted",
					children: "画面不重画。时间不对或漏一张会停住，重试还是这一轮。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 mb-2 flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-12 flex-1 rounded-2xl ring-1 ring-line",
						onClick: onClose,
						children: "取消"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !!plan.error,
						className: "h-12 flex-1 rounded-2xl bg-primary text-primary-fg disabled:opacity-40",
						onClick: () => {
							const fresh = computePlan({
								n: photos.length,
								now: Date.now(),
								owned,
								startMs,
								endMs,
								intervalMs
							});
							if (!fresh.error) onConfirm(fresh, strict);
						},
						children: "确定"
					})]
				})
			] })]
		})]
	});
}
function Field({ label, hint, auto, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mt-3 block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "mb-1.5 flex items-center gap-2 text-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
				hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted",
					children: hint
				}) : null,
				auto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-primary",
					children: "自动"
				}) : null
			]
		}), children]
	});
}
function readInterval(text, unit) {
	if (!text.trim()) return null;
	const value = Number(text);
	if (!Number.isFinite(value)) return null;
	return value * (unit === "m" ? 6e4 : 1e3);
}
var COLUMNS = 4;
function Grid({ photos, onOpen, onReorder }) {
	const scrollerRef = (0, import_react.useRef)(null);
	const photosRef = (0, import_react.useRef)(photos);
	photosRef.current = photos;
	const blockClick = (0, import_react.useRef)(false);
	const dragRef = (0, import_react.useRef)(null);
	const point = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const ghost = (0, import_react.useRef)(null);
	const ghostSize = (0, import_react.useRef)({
		w: 72,
		h: 96
	});
	const dragOrigin = (0, import_react.useRef)({
		left: 0,
		top: 0,
		w: 0,
		h: 0,
		px: 0,
		py: 0
	});
	const gridGeom = (0, import_react.useRef)(null);
	const indexRef = (0, import_react.useRef)(-1);
	const positions = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const [dragId, setDragId] = (0, import_react.useState)(null);
	const dragging = photos.find((photo) => photo.id === dragId);
	(0, import_react.useLayoutEffect)(() => {
		const nodes = [...document.querySelectorAll("[data-photo-id]")];
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const nextPositions = /* @__PURE__ */ new Map();
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
			node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
				duration: 170,
				easing: "ease-out"
			});
		}
		positions.current = nextPositions;
	});
	(0, import_react.useLayoutEffect)(() => {
		if (!dragId || !ghost.current) return;
		placeGhost(point.current.x, point.current.y);
	}, [dragId]);
	(0, import_react.useEffect)(() => {
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
		const next = /* @__PURE__ */ new Map();
		document.querySelectorAll("[data-photo-id]").forEach((node) => {
			node.getAnimations().forEach((animation) => animation.cancel());
			const id = node.dataset.photoId;
			if (id) next.set(id, node.getBoundingClientRect());
		});
		positions.current = next;
	}
	function placeGhost(x, y) {
		point.current = {
			x,
			y
		};
		const node = ghost.current;
		const origin = dragOrigin.current;
		if (!node || origin.w < 2) return;
		node.style.left = `${origin.left + (x - origin.px)}px`;
		node.style.top = `${origin.top + (y - origin.py)}px`;
	}
	function currentGhost() {
		const origin = dragOrigin.current;
		if (origin.w < 2) return null;
		const left = origin.left + (point.current.x - origin.px);
		const top = origin.top + (point.current.y - origin.py);
		return {
			left,
			top,
			right: left + origin.w,
			bottom: top + origin.h
		};
	}
	function captureGrid() {
		const nodes = [...document.querySelectorAll("[data-photo-id]")];
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
			scrollTop: scrollerRef.current?.scrollTop ?? 0
		};
	}
	function slotAt(box, count) {
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
	function onPointerDown(event, id) {
		if (event.button !== 0) return;
		const startX = event.clientX;
		const startY = event.clientY;
		const pointer = event.pointerId;
		const target = event.currentTarget;
		const scroller = scrollerRef.current;
		let mode = "pending";
		let lastY = startY;
		let timer = window.setTimeout(() => {
			timer = null;
			if (mode !== "pending") return;
			mode = "drag";
			blockClick.current = true;
			dragRef.current = id;
			const rect = target.getBoundingClientRect();
			const from = photosRef.current.findIndex((photo) => photo.id === id);
			indexRef.current = from;
			dragOrigin.current = {
				left: rect.left,
				top: rect.top,
				w: rect.width,
				h: rect.height,
				px: startX,
				py: startY
			};
			ghostSize.current = {
				w: rect.width,
				h: rect.height
			};
			captureGrid();
			if (scroller) scroller.style.touchAction = "none";
			target.setPointerCapture?.(pointer);
			placeGhost(startX, startY);
			setDragId(id);
		}, 400);
		const onTouchMove = (ev) => {
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
		const move = (ev) => {
			if (ev.pointerId !== pointer || mode !== "drag") return;
			ev.preventDefault();
			placeGhost(ev.clientX, ev.clientY);
			moveTo();
		};
		const end = (ev, cancelled) => {
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
		const onUp = (ev) => end(ev, false);
		const onCancel = (ev) => end(ev, true);
		document.addEventListener("touchmove", onTouchMove, {
			passive: false,
			capture: true
		});
		window.addEventListener("pointermove", move, { passive: false });
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onCancel);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: scrollerRef,
		className: `min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 pb-4 ${dragId ? "touch-none" : ""}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-4 gap-1.5",
			children: photos.map((photo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"data-photo-id": photo.id,
				className: `relative aspect-[3/4] overflow-hidden rounded-md bg-surface ring-1 ring-line select-none ${dragId === photo.id ? "opacity-40" : ""}`,
				onPointerDown: (event) => onPointerDown(event, photo.id),
				onContextMenu: (event) => event.preventDefault(),
				onClick: () => {
					if (blockClick.current) {
						blockClick.current = false;
						return;
					}
					const node = document.querySelector(`[data-photo-id="${photo.id}"]`);
					if (node) onOpen(photo.id, node.getBoundingClientRect());
				},
				children: [photo.thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: photo.thumb,
					alt: "",
					className: "h-full w-full object-contain",
					draggable: false
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex h-full items-center px-1 text-center text-xs text-muted",
					children: "无预览"
				}), photo.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-x-0 bottom-0 bg-primary px-1 py-0.5 text-xs text-primary-fg",
					children: "不能写"
				}) : null]
			}, photo.id))
		})
	}), dragging ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: ghost,
		className: "pointer-events-none fixed z-30 overflow-hidden rounded-md bg-surface shadow-lg ring-1 ring-line",
		style: {
			width: ghostSize.current.w,
			height: ghostSize.current.h
		},
		children: dragging.thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: dragging.thumb,
			alt: "",
			className: "h-full w-full object-contain"
		}) : null
	}) : null] });
}
function Lightbox({ photos, photoId, origin, onClose, onChange, onDelete }) {
	const photo = photos.find((item) => item.id === photoId);
	const index = photo ? photos.findIndex((item) => item.id === photo.id) : -1;
	const frameRef = (0, import_react.useRef)(null);
	const opened = (0, import_react.useRef)(false);
	const canTurn = (0, import_react.useRef)(false);
	const [url, setUrl] = (0, import_react.useState)("");
	const [ask, setAsk] = (0, import_react.useState)(false);
	const [dim, setDim] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => {
			canTurn.current = true;
		}, 400);
		return () => window.clearTimeout(timer);
	}, []);
	(0, import_react.useEffect)(() => {
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
		const cell = photo ? document.querySelector(`[data-photo-id="${photo.id}"]`) : null;
		if (!el || !cell || reduced) {
			onClose();
			return;
		}
		cell.scrollIntoView({
			block: "nearest",
			inline: "nearest"
		});
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
	function onNavigate(event) {
		if (!canTurn.current || ask) return;
		const box = frameRef.current?.getBoundingClientRect();
		const mid = box && box.width > 2 ? box.left + box.width / 2 : window.innerWidth / 2;
		const step = event.clientX < mid ? -1 : 1;
		const next = photos[index + step];
		if (next) onChange(next.id);
	}
	if (!photo) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-40 touch-manipulation",
		onClick: onNavigate,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `absolute inset-0 bg-bg transition-opacity duration-300 ${dim ? "opacity-100" : "opacity-0"}` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 flex items-center justify-center px-6 py-16",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					ref: frameRef,
					src: url,
					alt: "",
					className: "max-h-full max-w-full object-contain",
					draggable: false,
					onLoad: settle
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-safe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "关闭",
					className: "flex h-11 w-11 items-center justify-center rounded-full bg-surface text-fg ring-1 ring-line",
					onClick: (event) => {
						event.stopPropagation();
						close();
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 22,
						strokeWidth: 1.75
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "从列表去掉",
					className: "flex h-11 w-11 items-center justify-center rounded-full bg-surface text-fg ring-1 ring-line",
					onClick: (event) => {
						event.stopPropagation();
						setAsk(true);
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
						size: 20,
						strokeWidth: 1.75
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-muted",
				children: "点左边上一张，点右边下一张"
			}),
			ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-10 flex items-center justify-center bg-fg/40 px-6",
				onClick: (event) => event.stopPropagation(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-card bg-surface p-5 text-fg shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-medium",
							children: "从列表里去掉这张？"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "手机里的原图不会删。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-2xl ring-1 ring-line",
								onClick: () => setAsk(false),
								children: "取消"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-2xl bg-primary text-primary-fg",
								onClick: () => {
									setAsk(false);
									onDelete(photo.id);
								},
								children: "去掉"
							})]
						})
					]
				})
			}) : null
		]
	});
}
function MetaView({ photos, photoId, info, onClose, onChange, onDelete, onZoom }) {
	const index = photos.findIndex((photo) => photo.id === photoId);
	const photo = photos[index];
	const [ask, setAsk] = (0, import_react.useState)(false);
	if (!photo) return null;
	const prev = index > 0 ? photos[index - 1] : null;
	const next = index >= 0 && index < photos.length - 1 ? photos[index + 1] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-40 flex flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 gap-3 px-4 pt-safe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "看大图",
					className: "h-28 w-24 shrink-0 overflow-hidden rounded-md bg-surface ring-1 ring-line",
					onClick: onZoom,
					children: photo.thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: photo.thumb,
						alt: "",
						className: "h-full w-full object-cover"
					}) : null
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-28 min-w-0 flex-1 flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-0 items-start gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid min-w-0 flex-1 grid-cols-2 gap-x-2 text-xs leading-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate",
										children: ["模型 ", info.model]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate",
										children: ["步数 ", info.steps]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate",
										children: ["种子 ", info.seed]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate",
										children: ["CFG ", info.cfg]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "关闭",
								className: "flex h-7 w-7 shrink-0 items-center justify-center",
								onClick: onClose,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
									size: 18,
									strokeWidth: 1.75
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "从列表去掉",
								className: "flex h-7 w-7 shrink-0 items-center justify-center",
								onClick: () => setAsk(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									size: 16,
									strokeWidth: 1.75
								})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex gap-2 pb-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-7 rounded-md px-2 text-xs ring-1 ring-line disabled:opacity-40",
							disabled: !prev,
							onClick: () => prev && onChange(prev.id),
							children: "上一张"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-7 rounded-md px-2 text-xs ring-1 ring-line disabled:opacity-40",
							disabled: !next,
							onClick: () => next && onChange(next.id),
							children: "下一张"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-safe",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-bold text-[#c23b33]",
						children: "正面提示词"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 whitespace-pre-wrap break-words text-sm leading-6",
						children: info.positive || "—"
					}),
					info.characters.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-bold text-[#c23b33]",
							children: "角色提示词"
						}), info.characters.map((line, number) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: ["角色", number + 1]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 whitespace-pre-wrap break-words text-sm leading-6",
								children: line
							})]
						}, `${number}-${line.slice(0, 12)}`))]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-5 text-lg font-bold text-[#c23b33]",
						children: "负面提示词"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 whitespace-pre-wrap break-words text-sm leading-6",
						children: info.negative || "—"
					})
				]
			}),
			ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-10 flex items-center justify-center bg-fg/40 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-card bg-surface p-5 text-fg shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-medium",
							children: "从列表里去掉这张？"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "手机里的原图不会删。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-2xl ring-1 ring-line",
								onClick: () => setAsk(false),
								children: "取消"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-2xl bg-primary text-primary-fg",
								onClick: () => onDelete(photo.id),
								children: "去掉"
							})]
						})
					]
				})
			}) : null
		]
	});
}
function Studio() {
	const [photos, setPhotos] = (0, import_react.useState)([]);
	const [reading, setReading] = (0, import_react.useState)(null);
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [origin, setOrigin] = (0, import_react.useState)(null);
	const [sheet, setSheet] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [blocked, setBlocked] = (0, import_react.useState)(null);
	const [askClear, setAskClear] = (0, import_react.useState)(false);
	const [barOpen, setBarOpen] = (0, import_react.useState)(true);
	const [folderName, setFolderName] = (0, import_react.useState)(null);
	const [pause, setPause] = (0, import_react.useState)(null);
	const [readOn, setReadOn] = (0, import_react.useState)(false);
	const [view, setView] = (0, import_react.useState)("light");
	const [zoom, setZoom] = (0, import_react.useState)(false);
	const seq = (0, import_react.useRef)(0);
	const photosRef = (0, import_react.useRef)(photos);
	photosRef.current = photos;
	const cancelSave = (0, import_react.useRef)(false);
	const saving = (0, import_react.useRef)(false);
	const folderRef = (0, import_react.useRef)(null);
	const roundRef = (0, import_react.useRef)(null);
	const photoInput = (0, import_react.useRef)(null);
	const fileInput = (0, import_react.useRef)(null);
	const readOnRef = (0, import_react.useRef)(false);
	readOnRef.current = readOn;
	const showGen = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		loadDir().then((dir) => {
			if (!dir) return;
			folderRef.current = dir;
			setFolderName(dir.name);
		}).catch(() => {});
	}, []);
	async function addFiles(list) {
		if (!list || !list.length || reading || progress || saving.current) return;
		const files = [...list];
		const prepared = [];
		let skipped = 0;
		for (let index = 0; index < files.length; index += 1) {
			setReading(`正在读取 ${index + 1}/${files.length}`);
			const file = files[index];
			try {
				const bytes = new Uint8Array(await file.arrayBuffer());
				const info = inspect(bytes);
				if (!info.image) {
					skipped += 1;
					continue;
				}
				let thumb = "";
				try {
					thumb = await makeThumb(file);
				} catch {
					thumb = "";
				}
				prepared.push({
					id: crypto.randomUUID(),
					name: file.name || "未命名",
					file,
					thumb,
					originalTime: readOriginalTime(bytes, file.lastModified || Date.now()),
					seq: seq.current++,
					reason: info.ok ? null : info.reason,
					ext: info.ok ? info.kind === "jpeg" ? "jpg" : info.kind : "jpg",
					meta: readOnRef.current ? readTextMeta(bytes) : void 0
				});
			} catch {
				skipped += 1;
			}
		}
		prepared.sort((a, b) => b.originalTime - a.originalTime || a.seq - b.seq);
		const prev = photosRef.current;
		const room = Math.max(0, 200 - prev.length);
		const take = prepared.slice(0, room);
		const dropped = prepared.length - take.length;
		setPhotos([...take, ...prev]);
		if (prev.length >= 200 && prepared.length) toast(`已经有 200 张，先去掉一些再加`);
		else if (dropped) toast(`只加入了 ${take.length} 张，有 ${dropped} 张因为超过 200 张没有加入`);
		if (skipped) toast(`跳过了 ${skipped} 个不是图片的文件`);
		setReading(null);
	}
	function resetOrder() {
		setPhotos((prev) => [...prev].sort((a, b) => b.originalTime - a.originalTime || a.seq - b.seq));
		toast("已恢复成按原来的时间排列");
	}
	function remove(id) {
		if (saving.current) return;
		const prev = photosRef.current;
		const index = prev.findIndex((photo) => photo.id === id);
		const next = prev.filter((photo) => photo.id !== id);
		photosRef.current = next;
		setPhotos(next);
		if (openId !== id) return;
		if (!next.length) {
			setOpenId(null);
			setZoom(false);
			return;
		}
		showPhoto(next[Math.min(Math.max(index, 0), next.length - 1)].id);
	}
	async function showPhoto(id) {
		const gen = ++showGen.current;
		const photo = photosRef.current.find((item) => item.id === id);
		if (!photo) return;
		setOpenId(id);
		if (!readOnRef.current) {
			setView("light");
			setZoom(false);
			return;
		}
		let meta = photo.meta;
		if (meta === void 0) {
			const bytes = new Uint8Array(await photo.file.arrayBuffer());
			if (gen !== showGen.current) return;
			meta = readTextMeta(bytes);
			setPhotos((prev) => prev.map((item) => item.id === id ? {
				...item,
				meta
			} : item));
		}
		if (meta) {
			setView("meta");
			return;
		}
		if (photo.stealth) {
			setView("light");
			setZoom(false);
			return;
		}
		setView("light");
		const found = await readStealth(photo.file);
		if (gen !== showGen.current) return;
		setPhotos((prev) => prev.map((item) => item.id === id ? {
			...item,
			meta: found,
			stealth: true
		} : item));
		if (!found) setZoom(false);
		setView(found ? "meta" : "light");
	}
	function toggleRead() {
		setReadOn((on) => {
			if (on) return false;
			fillText();
			return true;
		});
	}
	async function fillText() {
		const current = photosRef.current.filter((photo) => photo.meta === void 0);
		if (!current.length) return;
		const updates = /* @__PURE__ */ new Map();
		for (const photo of current) {
			const bytes = new Uint8Array(await photo.file.arrayBuffer());
			updates.set(photo.id, readTextMeta(bytes));
		}
		setPhotos((prev) => prev.map((photo) => updates.has(photo.id) ? {
			...photo,
			meta: updates.get(photo.id) ?? null
		} : photo));
	}
	async function exportPlan(plan, strict) {
		if (saving.current || roundRef.current) return;
		saving.current = true;
		cancelSave.current = false;
		const snapshot = photos.slice();
		const total = snapshot.length;
		setProgress({
			done: 0,
			total
		});
		try {
			const dir = await readyDir(folderRef.current);
			folderRef.current = dir;
			setFolderName(dir.name);
			await rememberDir(dir).catch(() => {});
			const problems = await preflight(snapshot);
			if (problems.length) {
				setProgress(null);
				setSheet(false);
				setBlocked(problems);
				saving.current = false;
				return;
			}
			roundRef.current = {
				prefix: batchStamp(Date.now()),
				photos: snapshot,
				times: plan.times,
				dir,
				next: total - 1,
				verified: 0,
				lastName: null,
				lastTime: null,
				strict
			};
			await runRound();
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				setProgress(null);
				saving.current = false;
				return;
			}
			setProgress(null);
			setSheet(false);
			saving.current = false;
			notify(false, error instanceof Error ? error.message : "没能开始保存");
		}
	}
	async function runRound() {
		const round = roundRef.current;
		if (!round) return;
		const total = round.photos.length;
		while (round.next >= 0) {
			if (cancelSave.current) {
				endRound();
				return;
			}
			const index = round.next;
			const photo = round.photos[index];
			const number = index + 1;
			const filename = `ord_${round.prefix}_${pad(number)}.${photo.ext}`;
			try {
				if (round.lastName) await previousStillThere(round.dir, round.lastName, number);
				const stamped = stamp(new Uint8Array(await photo.file.arrayBuffer()), round.times[index]);
				const saved = await putFile(round.dir, filename, stamped);
				const planned = round.times[index];
				const written = await timeOf(saved, planned);
				if (written !== planned) throw new Error(`时间不对，应该是 ${clock(planned)}，写成了 ${clock(written)}`);
				if (round.lastTime != null) {
					const gap = written - round.lastTime;
					const expected = planned - round.times[index + 1];
					if (gap !== expected) throw new Error(`间隔不对，和上一张差了 ${seconds(gap)} 秒，应该差 ${seconds(expected)} 秒`);
				}
				round.lastName = filename;
				round.lastTime = written;
				round.verified += 1;
				round.next = index - 1;
				setProgress({
					done: round.verified,
					total
				});
				if (round.strict && round.next >= 0) await sleep(1e3);
			} catch (error) {
				const reason = error instanceof Error ? error.message : "没能写入";
				setProgress(null);
				setSheet(false);
				setPause({
					number,
					name: photo.name,
					reason
				});
				return;
			}
		}
		const problem = await auditTimes(round);
		if (problem) {
			round.next = problem.index;
			if (problem.index + 1 < total) {
				const prev = round.photos[problem.index + 1];
				round.lastName = `ord_${round.prefix}_${pad(problem.index + 2)}.${prev.ext}`;
				round.lastTime = round.times[problem.index + 1];
			} else {
				round.lastName = null;
				round.lastTime = null;
			}
			setProgress(null);
			setSheet(false);
			setPause({
				number: problem.index + 1,
				name: round.photos[problem.index].name,
				reason: problem.reason
			});
			return;
		}
		setProgress(null);
		setSheet(false);
		roundRef.current = null;
		saving.current = false;
		cancelSave.current = false;
		if (round.verified === total) notify(true, `这一轮 ${total} 张，时间间隔也对`);
		else notify(false, `这一轮只确认了 ${round.verified} 张，操作区是 ${total} 张`);
	}
	function endRound() {
		const round = roundRef.current;
		const verified = round?.verified ?? 0;
		const total = round?.photos.length ?? 0;
		setPause(null);
		setProgress(null);
		setSheet(false);
		roundRef.current = null;
		saving.current = false;
		cancelSave.current = false;
		notify(false, `这一轮只确认了 ${verified} 张，操作区是 ${total} 张`);
	}
	function retryRound() {
		if (!roundRef.current || !saving.current) return;
		cancelSave.current = false;
		setPause(null);
		setSheet(true);
		setProgress({
			done: roundRef.current.verified,
			total: roundRef.current.photos.length
		});
		runRound();
	}
	async function pickFolder() {
		if (saving.current) return;
		try {
			const dir = await chooseDir();
			folderRef.current = dir;
			setFolderName(dir.name);
			await rememberDir(dir).catch(() => {});
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
			notify(false, error instanceof Error ? error.message : "没能选中文件夹");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "fixed inset-0 overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, { position: "top-center" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex h-full w-full max-w-md flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
						className: "shrink-0 px-4 pt-safe",
						children: barOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-11 items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "shrink-0 font-serif text-xl leading-none",
										children: "时序"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm text-muted",
										children: reading ?? `${photos.length} 张`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": "收起",
										className: "flex h-7 w-7 shrink-0 items-center justify-center text-fg",
										onClick: () => setBarOpen(false),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
											size: 18,
											strokeWidth: 1.75
										})
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex shrink-0 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "flex h-11 items-center gap-1 rounded-full bg-fg px-3 text-sm text-primary-fg disabled:opacity-40",
									disabled: !!reading || !!progress || !!pause,
									onClick: () => photoInput.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, {
										size: 16,
										strokeWidth: 1.75
									}), "照片"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "flex h-11 items-center gap-1 rounded-full px-3 text-sm ring-1 ring-line disabled:opacity-40",
									disabled: !!reading || !!progress || !!pause,
									onClick: () => fileInput.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
										size: 16,
										strokeWidth: 1.75
									}), "文件"]
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-5 items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-5 text-muted",
								children: reading ?? `${photos.length} 张`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "展开",
								className: "flex h-5 w-5 items-center justify-center text-fg",
								onClick: () => setBarOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
									size: 16,
									strokeWidth: 1.75
								})
							})]
						})
					}),
					photos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-lg",
							children: "先把图片加进来"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-6 text-muted",
							children: "新的在左上。长按拖动排序，点一下看大图。图片只留在这次打开里，刷新会清空。"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid, {
						photos,
						onOpen: (id, rect) => {
							setOrigin(rect);
							setZoom(false);
							showPhoto(id);
						},
						onReorder: (from, to) => {
							if (saving.current) return;
							setPhotos((prev) => {
								const next = prev.slice();
								const [item] = next.splice(from, 1);
								if (!item) return prev;
								next.splice(to, 0, item);
								return next;
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
						className: "flex shrink-0 items-center gap-1 border-t border-line px-2 pt-3 pb-safe",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-12 w-11 shrink-0 flex-col items-center justify-center gap-0.5 text-[11px] disabled:opacity-40",
								disabled: !photos.length || !!progress || !!pause,
								onClick: resetOrder,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
									size: 18,
									strokeWidth: 1.75
								}), "重置"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-12 w-11 shrink-0 flex-col items-center justify-center gap-0.5 text-[11px] disabled:opacity-40",
								disabled: !photos.length || !!progress || !!pause,
								onClick: () => setAskClear(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									size: 18,
									strokeWidth: 1.75
								}), "清空"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `flex h-12 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] ${readOn ? "bg-fg text-primary-fg" : ""}`,
								onClick: toggleRead,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanText, {
									size: 18,
									strokeWidth: 1.75
								}), "读参"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ml-auto flex h-12 w-14 shrink-0 flex-col items-center justify-center gap-0.5 text-[11px] disabled:opacity-40",
								disabled: !!progress || !!pause,
								onClick: () => void pickFolder(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
									size: 18,
									strokeWidth: 1.75
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-full truncate text-center",
									children: folderName ?? "文件夹"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-12 w-20 shrink-0 rounded-2xl bg-primary text-sm text-primary-fg disabled:opacity-40",
								disabled: !photos.length || !!reading || !!progress || !!pause,
								onClick: () => setSheet(true),
								children: "输出"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: photoInput,
				type: "file",
				accept: "image/*",
				multiple: true,
				className: "hidden",
				onChange: (event) => {
					addFiles(event.target.files);
					event.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileInput,
				type: "file",
				accept: "image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.bmp,.avif,application/octet-stream",
				multiple: true,
				className: "hidden",
				onChange: (event) => {
					addFiles(event.target.files);
					event.target.value = "";
				}
			}),
			openId && view === "meta" && photos.find((photo) => photo.id === openId)?.meta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaView, {
				photos,
				photoId: openId,
				info: photos.find((photo) => photo.id === openId).meta,
				onClose: () => {
					setZoom(false);
					setOpenId(null);
				},
				onChange: (id) => {
					setOrigin(null);
					setZoom(false);
					showPhoto(id);
				},
				onDelete: remove,
				onZoom: () => setZoom(true)
			}) : null,
			openId && (view !== "meta" || zoom || !photos.find((photo) => photo.id === openId)?.meta) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbox, {
				photos,
				photoId: openId,
				origin,
				onClose: () => {
					if (zoom && view === "meta") setZoom(false);
					else setOpenId(null);
				},
				onChange: (id) => {
					setOrigin(null);
					showPhoto(id);
				},
				onDelete: remove
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportSheet, {
				open: sheet,
				photos,
				progress,
				onClose: () => setSheet(false),
				onConfirm: (plan, strict) => void exportPlan(plan, strict),
				onStop: () => {
					cancelSave.current = true;
				}
			}),
			blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "先不保存",
				onClose: () => setBlocked(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-6 text-muted",
					children: [
						"有 ",
						blocked.length,
						" 张写不了时间。去掉之后再输出。还没开始保存。"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 max-h-64 overflow-y-auto",
					children: blocked.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 border-t border-line py-2",
						children: [item.thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: item.thumb,
							alt: "",
							className: "h-12 w-12 rounded-md object-contain bg-bg"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-12 w-12 rounded-md bg-bg" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm",
								children: item.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm text-primary",
								children: item.reason
							})]
						})]
					}, item.id))
				})]
			}) : null,
			pause ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "保存停了",
				onClose: () => {},
				dismiss: false,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-6 text-muted",
					children: [
						"停在第 ",
						pad(pause.number),
						" 张",
						pause.name ? `「${pause.name}」` : "",
						"。",
						pause.reason,
						"。点重试会从这一张接着写，还是这一轮。"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 flex-1 rounded-2xl ring-1 ring-line",
						onClick: endRound,
						children: "结束本轮"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 flex-1 rounded-2xl bg-primary text-primary-fg",
						onClick: retryRound,
						children: "重试"
					})]
				})]
			}) : null,
			askClear ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "清空列表？",
				onClose: () => setAskClear(false),
				dismiss: false,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "手机里的原图不会删除。"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 flex-1 rounded-2xl ring-1 ring-line",
						onClick: () => setAskClear(false),
						children: "取消"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 flex-1 rounded-2xl bg-primary text-primary-fg",
						onClick: () => {
							setPhotos([]);
							setOpenId(null);
							setAskClear(false);
						},
						children: "清空"
					})]
				})]
			}) : null
		]
	});
}
function Modal({ title, onClose, children, dismiss = true }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-fg/40 px-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-card bg-surface p-5 text-fg shadow-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-medium",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children
				}),
				dismiss ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-5 h-11 w-full rounded-2xl bg-primary text-primary-fg",
					onClick: onClose,
					children: "知道了"
				}) : null
			]
		})
	});
}
function pad(number) {
	return String(number).padStart(3, "0");
}
function serial(name) {
	const match = /_(\d+)\.[^.]+$/.exec(name);
	return match ? Number(match[1]) : null;
}
function notify(ok, text) {
	toast.dismiss("round-ok");
	toast.dismiss("round-bad");
	const options = {
		id: ok ? "round-ok" : "round-bad",
		duration: Infinity,
		style: ok ? {
			background: "#e7f6ec",
			color: "#146c2e",
			border: "1px solid #146c2e"
		} : {
			background: "#fdecea",
			color: "#8c1d18",
			border: "1px solid #8c1d18"
		}
	};
	if (ok) toast.success(text, options);
	else toast.error(text, options);
}
async function preflight(list) {
	const problems = [];
	for (const photo of list) {
		if (photo.reason) {
			problems.push({
				id: photo.id,
				name: photo.name,
				thumb: photo.thumb,
				reason: photo.reason
			});
			continue;
		}
		try {
			const info = inspect(new Uint8Array(await photo.file.arrayBuffer()));
			if (!info.ok) problems.push({
				id: photo.id,
				name: photo.name,
				thumb: photo.thumb,
				reason: info.reason
			});
		} catch {
			problems.push({
				id: photo.id,
				name: photo.name,
				thumb: photo.thumb,
				reason: "文件已损坏"
			});
		}
	}
	return problems;
}
async function readyDir(saved) {
	const handle = saved;
	if (handle?.requestPermission) try {
		if (await handle.requestPermission({ mode: "readwrite" }) === "granted") return handle;
	} catch {}
	return chooseDir();
}
async function chooseDir() {
	const pick = window.showDirectoryPicker;
	if (!pick) throw new Error("这个浏览器不能选文件夹，请用 Chrome 打开");
	return pick({ mode: "readwrite" });
}
async function previousStillThere(dir, lastName, currentNumber) {
	const lastNumber = serial(lastName);
	if (lastNumber == null || lastNumber !== currentNumber + 1) throw new Error(`序号不连着，上一张是 ${lastNumber == null ? "未知" : pad(lastNumber)}`);
	try {
		const file = await (await dir.getFileHandle(lastName)).getFile();
		if (file.name !== lastName || file.size <= 0) throw new Error("上一张在文件夹里对不上");
	} catch (error) {
		if (error instanceof Error && error.message === "上一张在文件夹里对不上") throw error;
		throw new Error("上一张不在文件夹里");
	}
}
function sleep(ms) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
async function putFile(dir, filename, bytes) {
	const handle = await dir.getFileHandle(filename, { create: true });
	const writable = await handle.createWritable();
	const copy = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(copy).set(bytes);
	await writable.write(copy);
	await writable.close();
	const saved = await handle.getFile();
	const number = serial(filename);
	if (saved.name !== filename || number == null) throw new Error(`序号不对，写出来的是 ${saved.name}`);
	if (saved.size !== bytes.byteLength) throw new Error("大小对不上，这一张不算成功");
	return saved;
}
async function timeOf(file, planned) {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const problem = timeProblem(bytes, planned);
	if (problem) throw new Error(problem);
	const ms = readOriginalTime(bytes, NaN);
	if (ms !== planned) throw new Error(`时间不对，应该是 ${clock(planned)}，写成了 ${Number.isFinite(ms) ? clock(ms) : "读不出来"}`);
	return ms;
}
function clock(ms) {
	return formatClock(ms);
}
function seconds(ms) {
	const value = Math.round(ms / 10) / 100;
	return String(value);
}
async function auditTimes(round) {
	let newer = null;
	for (let index = 0; index < round.photos.length; index += 1) {
		const photo = round.photos[index];
		const filename = `ord_${round.prefix}_${pad(index + 1)}.${photo.ext}`;
		try {
			const written = await timeOf(await (await round.dir.getFileHandle(filename)).getFile(), round.times[index]);
			if (written !== round.times[index]) return {
				index,
				reason: `时间不对，应该是 ${clock(round.times[index])}，写成了 ${clock(written)}`
			};
			if (newer != null) {
				const gap = newer - written;
				const expected = round.times[index - 1] - round.times[index];
				if (gap !== expected) return {
					index,
					reason: `和第 ${pad(index)} 张差了 ${seconds(gap)} 秒，应该差 ${seconds(expected)} 秒`
				};
			}
			newer = written;
		} catch (error) {
			const reason = error instanceof Error ? error.message : "读不出拍摄时间";
			return {
				index,
				reason
			};
		}
	}
	return null;
}
async function makeThumb(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 240 / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) {
		bitmap.close();
		return "";
	}
	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	return canvas.toDataURL("image/jpeg", .72);
}
var SplitComponent = Studio;
//#endregion
export { SplitComponent as component };
