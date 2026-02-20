// src/admin/editors/RichtextEditor.tsx
import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { LinkWithRef } from "../extensions/LinkWithRef";
import { ImageWithControls } from "../extensions/ImageWithControls";
import Modal, { ModalFooter } from "../components/Modal";
import LinkModal from "../components/richtext/LinkModal";
import type { FieldDefinition } from "../types";
import { api } from "../lib/api";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Upload,
  FolderOpen,
  Loader2,
  Quote,
  RemoveFormatting,
} from "lucide-react";

interface Props {
  field: FieldDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}

export default function RichtextEditor({ value, onChange }: Props) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkWithRef.configure({ openOnClick: false }),
      ImageWithControls,
    ],
    content: (value as string) || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Disable editor when modals are open to prevent keystroke capture
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!showLinkModal && !showImagePicker);
  }, [editor, showLinkModal, showImagePicker]);

  if (!editor) return null;

  // Get current link attributes if cursor is in a link
  const linkAttrs = editor.getAttributes("link");
  const currentHref = linkAttrs.href && linkAttrs.href !== "#" ? linkAttrs.href : undefined;
  const currentContentRef = linkAttrs.contentRef;

  return (
    <div
      className="border border-[#E8E8E3] rounded-lg bg-white max-h-[70vh] flex flex-col transition-all duration-200 hover:border-[#DDDDD8] focus-within:border-[#E5644E] focus-within:ring-2 focus-within:ring-[#E5644E]/10"
      onClick={() => editor.commands.focus()}
    >
      {/* Toolbar */}
      <div className="flex gap-1 px-3 py-2 border-b border-[#E8E8E3] bg-[#FAFAF8] flex-wrap rounded-t-lg sticky top-0 z-10">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px bg-[#E8E8E3] mx-1" />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>
        <div className="w-px bg-[#E8E8E3] mx-1" />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px bg-[#E8E8E3] mx-1" />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => setShowLinkModal(true)}
          title={editor.isActive("link") ? "Edit link" : "Add link"}
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link"
          >
            <Unlink className="w-4 h-4" />
          </ToolbarButton>
        )}
        <ToolbarButton
          active={false}
          onClick={() => setShowImagePicker(true)}
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px bg-[#E8E8E3] mx-1" />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Remove formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="richtext-editor prose prose-sm max-w-none p-4 min-h-50 [&_.ProseMirror]:outline-none [&_.ProseMirror]:shadow-none [&_.ProseMirror:focus-visible]:shadow-none [&_.ProseMirror]:min-h-42"
        />
      </div>

      {/* Image Insert Modal */}
      {showImagePicker && (
        <ImageInsertModal
          onSelect={(path) => {
            editor.chain().focus().setImage({ src: path }).run();
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <LinkModal
          currentHref={currentHref}
          currentContentRef={currentContentRef}
          onSaveExternal={(href) => {
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href, contentRef: null })
              .run();
            setShowLinkModal(false);
          }}
          onSaveInternal={(contentRef) => {
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: "#", contentRef })
              .run();
            setShowLinkModal(false);
          }}
          onRemove={() => {
            editor.chain().focus().unsetLink().run();
            setShowLinkModal(false);
          }}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
}

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
}

function ImageInsertModal({
  onSelect,
  onClose,
}: {
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"upload" | "library">("upload");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api
      .getMedia()
      .then((res) => {
        const images = (res.data as MediaItem[]).filter((item) =>
          item.mimetype.startsWith("image/"),
        );
        setItems(images);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.uploadMedia(file);
      onSelect(result.data.path);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Insert Image" onClose={onClose} maxWidth="2xl">
      {/* Tabs */}
      <div className="flex border-b border-[#E8E8E3]">
        <button
          onClick={() => setTab("upload")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "upload"
              ? "text-[#E5644E] border-b-2 border-[#E5644E]"
              : "text-[#6B6B63] hover:text-[#1A1A18]"
          }`}
        >
          <Upload className="w-4 h-4 inline-block mr-2" />
          Upload New
        </button>
        <button
          onClick={() => setTab("library")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "library"
              ? "text-[#E5644E] border-b-2 border-[#E5644E]"
              : "text-[#6B6B63] hover:text-[#1A1A18]"
          }`}
        >
          <FolderOpen className="w-4 h-4 inline-block mr-2" />
          Media Library
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "upload" ? (
          <div className="flex flex-col items-center justify-center py-8">
            <label className="cursor-pointer">
              <div className="w-64 h-40 rounded-lg border-2 border-dashed border-[#E8E8E3] flex flex-col items-center justify-center bg-[#FAFAF8] hover:border-[#E5644E] hover:bg-[#FEF2F0] transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-[#E5644E] animate-spin mb-2" />
                    <p className="text-sm text-[#6B6B63]">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#9C9C91] mb-2" />
                    <p className="text-sm text-[#6B6B63]">Click to upload</p>
                    <p className="text-xs text-[#9C9C91] mt-1">
                      or drag and drop
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#9C9C91]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon
              className="w-12 h-12 mx-auto mb-3 text-[#9C9C91]"
              strokeWidth={1.5}
            />
            <p className="text-sm text-[#9C9C91]">No images in library</p>
            <p className="text-xs text-[#9C9C91] mt-1">
              Upload an image first
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.path)}
                className="aspect-square rounded-lg border-2 border-transparent hover:border-[#E5644E] overflow-hidden bg-[#F5F5F3] transition-colors focus:outline-none focus:border-[#E5644E]"
              >
                <img
                  src={item.path}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[#6B6B63] bg-white border border-[#E8E8E3] rounded-lg hover:bg-[#F5F5F3] transition-colors"
        >
          Cancel
        </button>
      </ModalFooter>
    </Modal>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-1.5 rounded-md text-[#6B6B63] transition-colors
        ${
          active
            ? "bg-[#E5644E]/10 text-[#E5644E]"
            : "hover:bg-[#F5F5F3] hover:text-[#1A1A18]"
        }
      `}
    >
      {children}
    </button>
  );
}
