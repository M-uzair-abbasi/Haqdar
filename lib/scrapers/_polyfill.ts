// Must be imported BEFORE any module that pulls in undici (cheerio does, transitively).
// Node 18 doesn't expose `File` globally; undici's webidl init requires it.
if (typeof (globalThis as any).File === "undefined") {
  (globalThis as any).File = class File {};
}
if (typeof (globalThis as any).FormData === "undefined") {
  (globalThis as any).FormData = class FormData {};
}
if (typeof (globalThis as any).Blob === "undefined") {
  (globalThis as any).Blob = class Blob {};
}
export {};
