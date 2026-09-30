// src/admin/components/richtext/LinkModal.tsx
import { useState } from "react";
import { ExternalLink, FileText, Paperclip } from "lucide-react";
import Modal, { ModalBody, ModalFooter } from "../Modal";
import ContentPicker from "../ContentPicker";
import { Button, Input, Label } from "../ui";
import MediaBrowser from "../media/MediaBrowser";

interface Props {
  /** Current href for external links */
  currentHref?: string;
  /** Current contentRef for internal links (format: "schema:id") */
  currentContentRef?: string;
  /** Only offer items from these collections on the "Page on this site" tab */
  collections?: string[];
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

export default function LinkModal({
  currentHref,
  currentContentRef,
  collections,
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

  const [chosen, setChosen] = useState<{ ref: string; label: string } | null>(
    currentContentRef ? { ref: currentContentRef, label: currentContentRef } : null,
  );

  // The File tab is the media library in pick mode; one click chooses.
  // Images are deliberately excluded: those belong in the editor's image button.
  const currentFile = currentHref?.startsWith("/uploads/") ? currentHref : undefined;

  const handleSave = () => {
    if (tab === "external") {
      let finalUrl = url.trim();
      if (!finalUrl) return;
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("/") && !finalUrl.startsWith("#")) {
        finalUrl = "https://" + finalUrl;
      }
      onSaveExternal(finalUrl);
      return;
    }
    if (chosen) onSaveInternal(chosen.ref, chosen.label);
  };

  const hasExistingLink = currentHref || currentContentRef;
  const canSave = (tab === "external" && url.trim()) || (tab === "internal" && chosen);

  /** The body of the tab that is open: one list of things to link to. */
  function tabPanel() {
    if (tab === "file") {
      return (
        <MediaBrowser
          mode="pick"
          kinds={["document", "audio", "video"]}
          selectedPath={currentFile}
          onPick={onSaveExternal}
          className="-mx-6 -my-5 h-[60vh]"
        />
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

    return (
      <ContentPicker
        collections={collections}
        selected={chosen ? [chosen.ref] : []}
        onToggle={(ref, label) => setChosen({ ref, label })}
        onLoaded={(listed) => {
          // Keep the label current when the link is saved without re-choosing.
          const match = chosen && listed.find((i) => i.ref === chosen.ref);
          if (match && match.label !== chosen.label) setChosen(match);
        }}
      />
    );
  }

  return (
    <Modal title={hasExistingLink ? "Edit link" : "Add a link"} onClose={onClose} maxWidth={tab === "file" ? "full" : "xl"}>
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
        {tab !== "file" && (
          <Button onClick={handleSave} disabled={!canSave}>
            {hasExistingLink ? "Update" : "Insert"}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
