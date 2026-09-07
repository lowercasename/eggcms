// src/admin/components/richtext/LinkModal.tsx
import { useState, useEffect } from "react";
import { ExternalLink, FileText, Paperclip } from "lucide-react";
import Modal, { ModalBody, ModalFooter } from "../Modal";
import { api } from "../../lib/api";
import { errorMessage } from "../../lib/errors";
import { Button, EmptyState, Input, Label, SearchInput, Select } from "../ui";

interface Schema {
  name: string;
  label: string;
  type: string;
  labelField?: string;
}

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  kind: string | null;
}

interface ContentItem {
  id: string;
  [key: string]: unknown;
}

interface Props {
  /** Current href for external links */
  currentHref?: string;
  /** Current contentRef for internal links (format: "schema:id") */
  currentContentRef?: string;
  onSaveExternal: (href: string) => void;
  onSaveInternal: (contentRef: string, displayLabel: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

type Tab = "external" | "internal" | "file";

const TABS: Array<{ value: Tab; label: string; Icon: typeof ExternalLink }> = [
  { value: "external", label: "Web address", Icon: ExternalLink },
  { value: "internal", label: "Page on this site", Icon: FileText },
  { value: "file", label: "File", Icon: Paperclip },
];

/** A list of choices, one highlighted. */
function ChoiceList<T extends { key: string; label: string }>({
  items,
  selected,
  onSelect,
  empty,
  icon,
}: {
  items: T[];
  selected: string;
  onSelect: (key: string) => void;
  empty: string;
  icon?: typeof Paperclip;
}) {
  const Icon = icon;
  return (
    <div className="control max-h-64 overflow-y-auto divide-y divide-line-hair !rounded-control">
      {items.length === 0 ? (
        <p className="m-0 py-6 text-center text-[15px] text-ink-2">{empty}</p>
      ) : (
        items.map((item) => {
          const active = selected === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 min-h-[48px] text-left text-[15px] transition-colors ${
                active ? "bg-selected text-white font-semibold" : "text-ink hover:bg-page"
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-ink-2"}`} aria-hidden />}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })
      )}
    </div>
  );
}

export default function LinkModal({
  currentHref,
  currentContentRef,
  onSaveExternal,
  onSaveInternal,
  onRemove,
  onClose,
}: Props) {
  // A link pointing into the uploads directory is a file link, so editing one
  // reopens on that tab. (Local storage only: with PUBLIC_URL or S3 the href
  // is absolute and is treated as a web address.)
  const initialTab: Tab = currentContentRef ? "internal" : currentHref?.startsWith("/uploads/") ? "file" : "external";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [url, setUrl] = useState(currentHref || "");

  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Images are deliberately excluded: those belong in the editor's image button.
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(currentHref?.startsWith("/uploads/") ? currentHref : "");
  const [fileQuery, setFileQuery] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    if (currentContentRef) {
      const [schema, id] = currentContentRef.split(":");
      setSelectedSchema(schema);
      setSelectedItem(id);
    }
  }, [currentContentRef]);

  useEffect(() => {
    api
      .getSchemas()
      .then((res) => {
        const collections = res.data.filter((s) => s.type === "collection");
        setSchemas(collections);
        if (currentContentRef) {
          const [schema] = currentContentRef.split(":");
          if (collections.find((s) => s.name === schema)) setSelectedSchema(schema);
        }
      })
      .catch((err) => setLoadError(`Could not load the kinds of page: ${errorMessage(err, "request failed")}`))
      .finally(() => setLoadingSchemas(false));
  }, [currentContentRef]);

  useEffect(() => {
    api
      .getMedia()
      .then((res) => setFiles((res.data as MediaItem[]).filter((item) => item.kind !== "image")))
      .catch((err) => setLoadError(`Could not load the files: ${errorMessage(err, "request failed")}`))
      .finally(() => setLoadingFiles(false));
  }, []);

  useEffect(() => {
    if (!selectedSchema) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    api
      .getContent<ContentItem>(selectedSchema)
      .then((res) => setItems(res.data))
      .catch((err) => setLoadError(`Could not load the pages: ${errorMessage(err, "request failed")}`))
      .finally(() => setLoadingItems(false));
  }, [selectedSchema]);

  const getItemLabel = (item: ContentItem): string => {
    const schema = schemas.find((s) => s.name === selectedSchema);
    const labelField = schema?.labelField || "title";
    return (item[labelField] as string) || item.id;
  };

  const filteredItems = items.filter((item) => !searchQuery || getItemLabel(item).toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = files.filter((file) => !fileQuery || file.filename.toLowerCase().includes(fileQuery.toLowerCase()));

  const handleSave = () => {
    if (tab === "file") {
      if (selectedFile) onSaveExternal(selectedFile);
      return;
    }
    if (tab === "external") {
      let finalUrl = url.trim();
      if (!finalUrl) return;
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("/") && !finalUrl.startsWith("#")) {
        finalUrl = "https://" + finalUrl;
      }
      onSaveExternal(finalUrl);
      return;
    }
    if (selectedSchema && selectedItem) {
      const item = items.find((i) => i.id === selectedItem);
      onSaveInternal(`${selectedSchema}:${selectedItem}`, item ? getItemLabel(item) : selectedItem);
    }
  };

  const hasExistingLink = currentHref || currentContentRef;
  const canSave =
    (tab === "external" && url.trim()) || (tab === "internal" && selectedSchema && selectedItem) || (tab === "file" && selectedFile);

  /** The body of the tab that is open: one list of things to link to. */
  function tabPanel() {
    if (tab === "file") {
      if (loadingFiles) return <p className="m-0 text-[15px] text-ink-2">Loading…</p>;
      if (files.length === 0) {
        return loadError ? null : <EmptyState icon={<Paperclip />} title="No files in the library" description="Upload a PDF on the Media page first." />;
      }
      return (
        <>
          <SearchInput value={fileQuery} onChange={setFileQuery} placeholder="Search files..." />
          <ChoiceList
            items={filteredFiles.map((f) => ({ key: f.path, label: f.filename }))}
            selected={selectedFile}
            onSelect={setSelectedFile}
            empty="No matching files"
            icon={Paperclip}
          />
        </>
      );
    }

    if (tab === "external") {
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="link-url">Web address</Label>
          <Input id="link-url" mono value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" autoFocus />
          <p className="m-0 text-[14px] text-ink-2">A full address, or a path on this site starting with /</p>
        </div>
      );
    }

    if (loadingSchemas) return <p className="m-0 text-[15px] text-ink-2">Loading…</p>;
    if (schemas.length === 0) return loadError ? null : <EmptyState icon={<FileText />} title="Nothing to link to yet" />;
    return (
      <>
        <div className="flex flex-col gap-2">
          <Label htmlFor="link-collection">Kind of page</Label>
          <Select
            id="link-collection"
            value={selectedSchema}
            onChange={(e) => {
              setSelectedSchema(e.target.value);
              setSelectedItem("");
              setSearchQuery("");
            }}
            options={schemas.map((s) => ({ value: s.name, label: s.label }))}
            placeholder="Choose…"
          />
        </div>

        {selectedSchema && (
          <div className="flex flex-col gap-2">
            <Label>Which one</Label>
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search items..." />
            {loadingItems ? (
              <p className="m-0 text-[15px] text-ink-2">Loading…</p>
            ) : (
              <ChoiceList
                items={filteredItems.map((i) => ({ key: i.id, label: getItemLabel(i) }))}
                selected={selectedItem}
                onSelect={setSelectedItem}
                empty={searchQuery ? "No matching items" : "Nothing in this collection yet"}
              />
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <Modal title={hasExistingLink ? "Edit link" : "Add a link"} onClose={onClose} maxWidth="xl">
      <div role="tablist" aria-label="Link to" className="flex border-b border-line-strong bg-page">
        {TABS.map(({ value, label, Icon }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(value)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3.5 min-h-[52px] -mb-px text-[15px] whitespace-nowrap transition-colors focus-visible:outline-offset-[-3px] ${
                active
                  ? "bg-panel text-ink font-bold border-b-[2.5px] border-ink"
                  : "text-ink-nav font-semibold border-b-[2.5px] border-transparent hover:border-line-strong hover:text-ink"
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <ModalBody className="flex flex-col gap-4">
        {loadError && (
          <p role="alert" className="m-0 text-[15px] text-danger-text">
            {loadError}
          </p>
        )}
        {tabPanel()}
      </ModalBody>

      <ModalFooter>
        {hasExistingLink && (
          <Button variant="destructive" onClick={onRemove} className="mr-auto">
            Remove link
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {hasExistingLink ? "Update" : "Insert"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
