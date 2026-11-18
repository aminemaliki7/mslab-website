/**
 * Studio editor state with undo/redo (pure; unit-tested in tests/unit/studio-editor.test.mts).
 *
 * The undoable part is the document (layers + chosen options). Gestures (drag, resize, rotate)
 * call `checkpoint` once when they start and `preview` while moving, so one gesture = one undo
 * step. Product, side and selection are UI state and are not undone.
 */
import type { Layer } from "../../../features/print-on-demand/design";
import type { OptionKind, ViewKey } from "../../../features/print-on-demand/studio";

/** A layer in the browser also references its local file (object URL), never sent as is. */
export type EditorLayer = Layer & { asset?: string };

export type EditorDoc = {
  layers: EditorLayer[];
  options: Partial<Record<OptionKind, string>>;
  /** Swatch for drawn placeholder products (no configured colours). */
  colorHex: string | null;
};

export type EditorState = {
  past: EditorDoc[];
  doc: EditorDoc;
  future: EditorDoc[];
  view: ViewKey;
  selectedId: string | null;
};

export type EditorAction =
  | { type: "add"; layer: EditorLayer }
  | { type: "update"; id: string; patch: Partial<EditorLayer>; mode: "commit" | "preview" }
  | { type: "checkpoint" }
  | { type: "remove"; id: string }
  | { type: "reorder"; id: string; direction: -1 | 1 }
  | { type: "select"; id: string | null }
  | { type: "view"; view: ViewKey }
  | { type: "option"; kind: OptionKind; id: string | null }
  | { type: "colorHex"; hex: string }
  | { type: "product"; view: ViewKey; colorHex: string | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" };

const HISTORY_LIMIT = 60;

export const initialEditorState = (view: ViewKey = "front", colorHex: string | null = null): EditorState => ({
  past: [],
  doc: { layers: [], options: {}, colorHex },
  future: [],
  view,
  selectedId: null,
});

function commit(state: EditorState, doc: EditorDoc): EditorState {
  return { ...state, past: [...state.past, state.doc].slice(-HISTORY_LIMIT), doc, future: [] };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { doc } = state;
  switch (action.type) {
    case "add":
      return { ...commit(state, { ...doc, layers: [...doc.layers, action.layer] }), selectedId: action.layer.id, view: action.layer.view };
    case "update": {
      const layers = doc.layers.map((l) => (l.id === action.id ? ({ ...l, ...action.patch } as EditorLayer) : l));
      return action.mode === "commit" ? commit(state, { ...doc, layers }) : { ...state, doc: { ...doc, layers } };
    }
    case "checkpoint":
      return { ...state, past: [...state.past, doc].slice(-HISTORY_LIMIT), future: [] };
    case "remove": {
      const next = commit(state, { ...doc, layers: doc.layers.filter((l) => l.id !== action.id) });
      return { ...next, selectedId: state.selectedId === action.id ? null : state.selectedId };
    }
    case "reorder": {
      // Order within the whole list; only layers of the same side matter visually.
      const index = doc.layers.findIndex((l) => l.id === action.id);
      if (index < 0) return state;
      const sameView = doc.layers.map((l, i) => [l, i] as const).filter(([l]) => l.view === doc.layers[index]!.view).map(([, i]) => i);
      const pos = sameView.indexOf(index);
      const target = sameView[pos + action.direction];
      if (target === undefined) return state;
      const layers = [...doc.layers];
      [layers[index], layers[target]] = [layers[target]!, layers[index]!];
      return commit(state, { ...doc, layers });
    }
    case "select":
      return { ...state, selectedId: action.id };
    case "view":
      return { ...state, view: action.view, selectedId: null };
    case "option": {
      const options = { ...doc.options };
      if (action.id) options[action.kind] = action.id;
      else delete options[action.kind];
      return commit(state, { ...doc, options });
    }
    case "colorHex":
      return commit(state, { ...doc, colorHex: action.hex });
    case "product":
      // Layers follow the visitor to the new product; options are product-specific.
      return { ...commit(state, { ...doc, options: {}, colorHex: action.colorHex }), view: action.view, selectedId: null };
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return { ...state, past: state.past.slice(0, -1), doc: previous, future: [doc, ...state.future], selectedId: keepSelection(previous, state.selectedId) };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return { ...state, past: [...state.past, doc], doc: next, future: state.future.slice(1), selectedId: keepSelection(next, state.selectedId) };
    }
    case "reset":
      return initialEditorState(state.view, doc.colorHex);
  }
}

const keepSelection = (doc: EditorDoc, id: string | null) => (id && doc.layers.some((l) => l.id === id) ? id : null);
