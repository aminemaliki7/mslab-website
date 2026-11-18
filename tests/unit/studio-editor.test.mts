/**
 * MSLAB Studio (ADR-026): editor history, print maths and file identification.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { editorReducer, initialEditorState, type EditorLayer } from "../../src/components/print-on-demand/studio/editor-state.ts";
import { effectiveDpi, insideArea, layerBoxPx, layerMm } from "../../src/features/print-on-demand/design-geometry.ts";
import { sameFormat, sniffFile } from "../../src/features/print-on-demand/file-sniff.ts";

const text = (id: string, view: "front" | "back" = "front"): EditorLayer =>
  ({ id, kind: "text", view, x: 0.5, y: 0.5, w: 0.5, rotation: 0, aspect: 0.2, text: id, font: "archivo", color: "#0E1A2B" }) as EditorLayer;

describe("editor history", () => {
  it("adds, then undoes and redoes", () => {
    let s = editorReducer(initialEditorState(), { type: "add", layer: text("a") });
    assert.equal(s.doc.layers.length, 1);
    assert.equal(s.selectedId, "a");
    s = editorReducer(s, { type: "undo" });
    assert.equal(s.doc.layers.length, 0);
    assert.equal(s.selectedId, null);
    s = editorReducer(s, { type: "redo" });
    assert.equal(s.doc.layers.length, 1);
  });

  it("a gesture (checkpoint + previews) is a single undo step", () => {
    let s = editorReducer(initialEditorState(), { type: "add", layer: text("a") });
    s = editorReducer(s, { type: "checkpoint" });
    for (const x of [0.4, 0.3, 0.2]) s = editorReducer(s, { type: "update", id: "a", patch: { x }, mode: "preview" });
    assert.equal(s.doc.layers[0]!.x, 0.2);
    s = editorReducer(s, { type: "undo" });
    assert.equal(s.doc.layers[0]!.x, 0.5);
  });

  it("a new change clears the redo stack", () => {
    let s = editorReducer(initialEditorState(), { type: "add", layer: text("a") });
    s = editorReducer(s, { type: "undo" });
    s = editorReducer(s, { type: "add", layer: text("b") });
    assert.equal(s.future.length, 0);
    assert.deepEqual(editorReducer(s, { type: "redo" }), s);
  });

  it("reorders only among layers of the same side", () => {
    let s = initialEditorState();
    for (const l of [text("a"), text("x", "back"), text("b")]) s = editorReducer(s, { type: "add", layer: l });
    s = editorReducer(s, { type: "reorder", id: "a", direction: 1 });
    assert.deepEqual(s.doc.layers.map((l) => l.id), ["b", "x", "a"]);
    assert.equal(editorReducer(s, { type: "reorder", id: "a", direction: 1 }), s, "already on top");
  });

  it("changing product keeps layers but clears product-specific options", () => {
    let s = editorReducer(initialEditorState(), { type: "add", layer: text("a") });
    s = editorReducer(s, { type: "option", kind: "size", id: "0b6e8a00-0000-4000-8000-000000000000" });
    s = editorReducer(s, { type: "product", view: "front", colorHex: "#FFFFFF" });
    assert.equal(s.doc.layers.length, 1);
    assert.deepEqual(s.doc.options, {});
  });
});

describe("print maths", () => {
  const area = { w: 300, h: 400 };
  it("converts fractions to millimetres and resolution", () => {
    const layer = { x: 0.5, y: 0.25, w: 0.5, aspect: 1, rotation: 0 };
    assert.deepEqual(layerMm(layer, { w: 300, h: 400 }), { centerX: 150, centerY: 100, width: 150, height: 150 });
    // 1772 px over 150 mm ≈ 300 DPI.
    assert.equal(effectiveDpi(1772, 150), 300);
  });

  it("detects a rotated layer leaving the printable area", () => {
    // A wide, short area (e.g. a mug band): a long text fits flat but not at 45°.
    const band = { w: 400, h: 100 };
    const layer = { x: 0.5, y: 0.5, w: 0.9, aspect: 0.2, rotation: 0 };
    assert.equal(insideArea(layerBoxPx(layer, band), band), true);
    assert.equal(insideArea(layerBoxPx({ ...layer, rotation: 45 }, band), band), false);
    assert.equal(insideArea(layerBoxPx({ ...layer, x: 0.9 }, area), area), false);
  });
});

describe("file identification (bytes, not declared type)", () => {
  const bytes = (...parts: Array<number[] | string>) =>
    new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)).concat(new Array(64).fill(0)));

  it("reads PNG dimensions", () => {
    const png = bytes([0x89], "PNG\r\n\x1a\n", [0, 0, 0, 13], "IHDR", [0, 0, 0x0b, 0xb8], [0, 0, 0x07, 0xd0]);
    assert.deepEqual(sniffFile(png), { mime: "image/png", width: 3000, height: 2000 });
  });

  it("reads JPEG dimensions from the frame header", () => {
    const jpeg = bytes([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0], [0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x00, 0x06, 0x00]);
    assert.deepEqual(sniffFile(jpeg), { mime: "image/jpeg", width: 1536, height: 1024 });
  });

  it("recognises PDF, PSD, SVG and rejects other content", () => {
    assert.equal(sniffFile(bytes("%PDF-1.7\n")).mime, "application/pdf");
    const psd = bytes("8BPS", [0, 1, 0, 0, 0, 0, 0, 0, 0, 3], [0, 0, 0x0d, 0x80], [0, 0, 0x12, 0x00]);
    assert.deepEqual(sniffFile(psd), { mime: "image/vnd.adobe.photoshop", width: 4608, height: 3456 });
    const svg = new TextEncoder().encode('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"></svg>');
    assert.deepEqual(sniffFile(svg), { mime: "image/svg+xml", width: 400, height: 200 });
    assert.equal(sniffFile(bytes("MZ\x90\x00 this is an executable")).mime, null);
    assert.equal(sniffFile(new TextEncoder().encode("<html><script>alert(1)</script></html>          ")).mime, null);
  });

  it("compares declared and detected formats by family", () => {
    assert.equal(sameFormat("application/x-photoshop", "image/vnd.adobe.photoshop"), true);
    assert.equal(sameFormat("image/png", "application/pdf"), false);
  });
});
