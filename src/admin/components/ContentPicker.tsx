// src/admin/components/ContentPicker.tsx
import { useEffect, useState } from "react";
import { Check, FileText } from "lucide-react";
import { api } from "../lib/api";
import { errorMessage } from "../lib/errors";
import { EmptyState, Label, SearchInput, Select } from "./ui";

interface Schema {
  name: string;
  label: string;
  type: string;
  labelField?: string;
}

interface ContentItem {
  id: string;
  [key: string]: unknown;
}

interface Props {
  /** Only offer these collections (all collections when absent or empty). */
  collections?: string[];
  /** The refs ("schema:id") currently chosen; they are shown highlighted. */
  selected: string[];
  /** Called with the ref and its display label when an item is clicked. */
  onToggle: (ref: string, label: string) => void;
  /** The collection to open on (defaults to the first selected ref's). */
  initialSchema?: string;
  /** Told each collection's items and their current labels once they load. */
  onLoaded?: (items: Array<{ ref: string; label: string }>) => void;
}

/** The label an item is listed under: its schema's labelField, then title, then its id. */
export function itemLabel(item: ContentItem, schema?: { labelField?: string }): string {
  const value = item[schema?.labelField || "title"];
  return typeof value === "string" && value ? value : item.id;
}

/**
 * Choose items from the site's collections: a collection menu (hidden when
 * there is only one to choose from), a search box, and the list. Used by the
 * link dialog (one item) and relation fields (several).
 */
export default function ContentPicker({ collections, selected, onToggle, initialSchema, onLoaded }: Props) {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [schemaName, setSchemaName] = useState(initialSchema ?? selected[0]?.split(":")[0] ?? "");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [query, setQuery] = useState("");
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSchemas()
      .then((res) => {
        const allowed = res.data.filter(
          (s) => s.type === "collection" && (!collections?.length || collections.includes(s.name)),
        );
        setSchemas(allowed);
        setSchemaName((current) => (allowed.some((s) => s.name === current) ? current : allowed.length === 1 ? allowed[0].name : ""));
      })
      .catch((err) => setError(`Could not load the kinds of page: ${errorMessage(err, "request failed")}`))
      .finally(() => setLoadingSchemas(false));
    // The allowed collections are fixed by the field definition.
  }, []);

  useEffect(() => {
    if (!schemaName) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    api
      .getContent<ContentItem>(schemaName)
      .then((res) => setItems(res.data))
      .catch((err) => setError(`Could not load the pages: ${errorMessage(err, "request failed")}`))
      .finally(() => setLoadingItems(false));
  }, [schemaName]);

  const schema = schemas.find((s) => s.name === schemaName);
  const listed = items.map((item) => ({ ref: `${schemaName}:${item.id}`, label: itemLabel(item, schema) }));

  useEffect(() => {
    if (!loadingItems && listed.length) onLoaded?.(listed);
    // Report once per load, not on every render.
  }, [items, schema, loadingItems]);

  const shown = listed
    .filter((i) => !query || i.label.toLowerCase().includes(query.toLowerCase()));

  if (loadingSchemas) return <p className="m-0 text-[15px] text-ink-2">Loading…</p>;

  return (
    <>
      {error && (
        <p role="alert" className="m-0 text-[15px] text-danger-text">
          {error}
        </p>
      )}
      {schemas.length === 0 ? (
        !error && <EmptyState icon={<FileText />} title="Nothing to link to yet" />
      ) : (
        <>
          {schemas.length > 1 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="picker-collection">Kind of page</Label>
              <Select
                id="picker-collection"
                value={schemaName}
                onChange={(e) => {
                  setSchemaName(e.target.value);
                  setQuery("");
                }}
                options={schemas.map((s) => ({ value: s.name, label: s.label }))}
                placeholder="Choose…"
              />
            </div>
          )}

          {schemaName && (
            <div className="flex flex-col gap-2">
              <Label>Which one</Label>
              <SearchInput value={query} onChange={setQuery} placeholder="Search items..." />
              {loadingItems ? (
                <p className="m-0 text-[15px] text-ink-2">Loading…</p>
              ) : (
                <div className="control max-h-64 overflow-y-auto divide-y divide-line-hair !rounded-control">
                  {shown.length === 0 ? (
                    <p className="m-0 py-6 text-center text-[15px] text-ink-2">
                      {query ? "No matching items" : "Nothing in this collection yet"}
                    </p>
                  ) : (
                    shown.map((item) => {
                      const active = selected.includes(item.ref);
                      return (
                        <button
                          key={item.ref}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onToggle(item.ref, item.label)}
                          className={`w-full flex items-center gap-3 px-3 py-3 min-h-[48px] text-left text-[15px] transition-colors ${
                            active ? "bg-selected text-white font-semibold" : "text-ink hover:bg-page"
                          }`}
                        >
                          <span className="truncate flex-1">{item.label}</span>
                          {active && <Check className="w-4 h-4 shrink-0 text-white" aria-hidden />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
