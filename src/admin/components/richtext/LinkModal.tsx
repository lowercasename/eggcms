// src/admin/components/richtext/LinkModal.tsx
import { useState, useEffect } from "react";
import { ExternalLink, FileText, Loader2, Search } from "lucide-react";
import Modal, { ModalBody, ModalFooter } from "../Modal";
import { api } from "../../lib/api";

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
  /** Current href for external links */
  currentHref?: string;
  /** Current contentRef for internal links (format: "schema:id") */
  currentContentRef?: string;
  /** Called when saving an external link */
  onSaveExternal: (href: string) => void;
  /** Called when saving an internal link */
  onSaveInternal: (contentRef: string, displayLabel: string) => void;
  /** Called when removing the link */
  onRemove: () => void;
  onClose: () => void;
}

type Tab = "external" | "internal";

export default function LinkModal({
  currentHref,
  currentContentRef,
  onSaveExternal,
  onSaveInternal,
  onRemove,
  onClose,
}: Props) {
  // Determine initial tab based on current link type
  const initialTab: Tab = currentContentRef ? "internal" : "external";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [url, setUrl] = useState(currentHref || "");

  // Internal link state
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // Parse current contentRef if present
  useEffect(() => {
    if (currentContentRef) {
      const [schema, id] = currentContentRef.split(":");
      setSelectedSchema(schema);
      setSelectedItem(id);
    }
  }, [currentContentRef]);

  // Load schemas on mount
  useEffect(() => {
    api
      .getSchemas()
      .then((res) => {
        // Only show collections (not singletons) for internal links
        const collections = res.data.filter((s) => s.type === "collection");
        setSchemas(collections);

        // If we have a currentContentRef, pre-select its schema
        if (currentContentRef) {
          const [schema] = currentContentRef.split(":");
          if (collections.find((s) => s.name === schema)) {
            setSelectedSchema(schema);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSchemas(false));
  }, [currentContentRef]);

  // Load items when schema is selected
  useEffect(() => {
    if (!selectedSchema) {
      setItems([]);
      return;
    }

    setLoadingItems(true);
    api
      .getContent<ContentItem>(selectedSchema)
      .then((res) => {
        setItems(res.data);
      })
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }, [selectedSchema]);

  const getItemLabel = (item: ContentItem): string => {
    const schema = schemas.find((s) => s.name === selectedSchema);
    const labelField = schema?.labelField || "title";
    return (item[labelField] as string) || item.id;
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const label = getItemLabel(item).toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  const handleSave = () => {
    if (tab === "external") {
      if (url.trim()) {
        // Auto-add https:// if no protocol
        let finalUrl = url.trim();
        if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("/")) {
          finalUrl = "https://" + finalUrl;
        }
        onSaveExternal(finalUrl);
      }
    } else {
      if (selectedSchema && selectedItem) {
        const contentRef = `${selectedSchema}:${selectedItem}`;
        const item = items.find((i) => i.id === selectedItem);
        const displayLabel = item ? getItemLabel(item) : selectedItem;
        onSaveInternal(contentRef, displayLabel);
      }
    }
  };

  const hasExistingLink = currentHref || currentContentRef;
  const canSave =
    (tab === "external" && url.trim()) ||
    (tab === "internal" && selectedSchema && selectedItem);

  return (
    <Modal title={hasExistingLink ? "Edit Link" : "Insert Link"} onClose={onClose}>
      {/* Tabs */}
      <div className="flex border-b border-[#E8E8E3]">
        <button
          onClick={() => setTab("external")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "external"
              ? "text-[#E5644E] border-b-2 border-[#E5644E]"
              : "text-[#6B6B63] hover:text-[#1A1A18]"
          }`}
        >
          <ExternalLink className="w-4 h-4 inline-block mr-2" />
          External URL
        </button>
        <button
          onClick={() => setTab("internal")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "internal"
              ? "text-[#E5644E] border-b-2 border-[#E5644E]"
              : "text-[#6B6B63] hover:text-[#1A1A18]"
          }`}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          Internal Link
        </button>
      </div>

      <ModalBody>
        {tab === "external" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A18] mb-2">
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm border border-[#E8E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5644E]/20 focus:border-[#E5644E]"
                autoFocus
              />
              <p className="mt-1 text-xs text-[#9C9C91]">
                Enter a full URL or a relative path starting with /
              </p>
            </div>
          </div>
        ) : loadingSchemas ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#9C9C91]" />
          </div>
        ) : schemas.length === 0 ? (
          <div className="text-center py-12">
            <FileText
              className="w-12 h-12 mx-auto mb-3 text-[#9C9C91]"
              strokeWidth={1.5}
            />
            <p className="text-sm text-[#9C9C91]">No collections available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Collection selector */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A18] mb-2">
                Collection
              </label>
              <select
                value={selectedSchema}
                onChange={(e) => {
                  setSelectedSchema(e.target.value);
                  setSelectedItem("");
                  setSearchQuery("");
                }}
                className="w-full px-3 py-2 text-sm border border-[#E8E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5644E]/20 focus:border-[#E5644E] bg-white"
              >
                <option value="">Select a collection...</option>
                {schemas.map((schema) => (
                  <option key={schema.name} value={schema.name}>
                    {schema.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Item selector */}
            {selectedSchema && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A18] mb-2">
                  Item
                </label>

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C91]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E8E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5644E]/20 focus:border-[#E5644E]"
                  />
                </div>

                {/* Items list */}
                <div className="border border-[#E8E8E3] rounded-lg max-h-48 overflow-y-auto">
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-[#9C9C91]" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-sm text-[#9C9C91]">
                      {searchQuery ? "No matching items" : "No items in this collection"}
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item.id)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          selectedItem === item.id
                            ? "bg-[#FEF2F0] text-[#E5644E]"
                            : "hover:bg-[#F5F5F3] text-[#1A1A18]"
                        }`}
                      >
                        {getItemLabel(item)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {hasExistingLink && (
          <button
            type="button"
            onClick={onRemove}
            className="px-4 py-2 text-sm font-medium text-[#DC4E42] bg-white border border-[#E8E8E3] rounded-lg hover:bg-[#FEF2F1] transition-colors mr-auto"
          >
            Remove Link
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[#6B6B63] bg-white border border-[#E8E8E3] rounded-lg hover:bg-[#F5F5F3] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 text-sm font-medium text-white bg-[#E5644E] rounded-lg hover:bg-[#D45A45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasExistingLink ? "Update" : "Insert"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
