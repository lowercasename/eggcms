// src/admin/test/fakeLibrary.ts
// A getMedia implementation for tests that behaves like the server: it
// searches, filters by kind, sorts, pages and counts.
import type { MediaItemResponse, MediaKind } from "../../lib/media";
import type { MediaQuery } from "../lib/api";

export function fakeLibrary(items: MediaItemResponse[]) {
  return async (query: MediaQuery = {}) => {
    const q = (query.q ?? "").trim().toLowerCase();
    const found = items.filter((i) => !q || i.filename.toLowerCase().includes(q));
    const counts: Record<"all" | MediaKind, number> = { all: found.length, image: 0, document: 0, audio: 0, video: 0 };
    for (const i of found) if (i.kind) counts[i.kind] += 1;
    let shown = found.filter((i) => !query.kinds || query.kinds.length === 0 || (i.kind !== null && query.kinds.includes(i.kind)));
    shown = [...shown].sort((a, b) =>
      query.sort === "name"
        ? a.filename.localeCompare(b.filename)
        : query.sort === "oldest"
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at)
    );
    const limit = query.limit ?? 60;
    const offset = query.offset ?? 0;
    return { data: shown.slice(offset, offset + limit), meta: { total: shown.length, counts, limit, offset } };
  };
}
