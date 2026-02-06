// src/admin/components/richtext/ImageSettingsModal.tsx
import { useState, useEffect } from "react";
import { Upload, FolderOpen, Loader2, Image as ImageIcon } from "lucide-react";
import Modal, { ModalBody, ModalFooter } from "../Modal";
import { api } from "../../lib/api";

type Size = "small" | "medium" | "large" | "full";

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
}

interface Props {
  src: string;
  size: Size;
  width: string | null;
  alt: string;
  caption: string;
  onSave: (attrs: {
    size: Size;
    width: string | null;
    alt: string;
    caption: string;
  }) => void;
  onReplace: (newSrc: string) => void;
  onClose: () => void;
}

export default function ImageSettingsModal({
  src,
  size: initialSize,
  width: initialWidth,
  alt: initialAlt,
  caption: initialCaption,
  onSave,
  onReplace,
  onClose,
}: Props) {
  const [size, setSize] = useState<Size>(initialSize);
  const [customWidth, setCustomWidth] = useState(initialWidth || "");
  const [alt, setAlt] = useState(initialAlt);
  const [caption, setCaption] = useState(initialCaption);
  const [showReplace, setShowReplace] = useState(false);

  const handleSave = () => {
    onSave({
      size,
      width: customWidth ? customWidth : null,
      alt,
      caption,
    });
  };

  const handleWidthChange = (value: string) => {
    const cleaned = value.replace(/[^0-9px]/g, "");
    setCustomWidth(cleaned);
  };

  const handleWidthBlur = () => {
    if (customWidth && !customWidth.endsWith("px")) {
      setCustomWidth(customWidth + "px");
    }
  };

  if (showReplace) {
    return (
      <ReplaceImageModal
        onSelect={(newSrc) => {
          onReplace(newSrc);
          setShowReplace(false);
        }}
        onBack={() => setShowReplace(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal title="Image Settings" onClose={onClose}>
      <ModalBody className="space-y-5">
        {/* Preview */}
        <div className="flex justify-center bg-[#F5F5F3] rounded-lg p-4">
          <img
            src={src}
            alt={alt}
            className="max-h-32 max-w-full object-contain rounded"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A18] mb-2">
            Size
          </label>
          <div className="flex gap-2">
            {(["small", "medium", "large", "full"] as Size[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setCustomWidth("");
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  size === s && !customWidth
                    ? "border-[#E5644E] bg-[#FEF2F0] text-[#E5644E]"
                    : "border-[#E8E8E3] bg-white text-[#6B6B63] hover:border-[#D0D0C8] hover:text-[#1A1A18]"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom width */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A18] mb-2">
            Custom Width{" "}
            <span className="text-[#9C9C91] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={customWidth}
            onChange={(e) => handleWidthChange(e.target.value)}
            onBlur={handleWidthBlur}
            placeholder="e.g., 300px"
            className="w-full px-3 py-2 text-sm border border-[#E8E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5644E]/20 focus:border-[#E5644E]"
          />
          <p className="mt-1 text-xs text-[#9C9C91]">
            Overrides size preset when set
          </p>
        </div>

        {/* Alt text */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A18] mb-2">
            Alt Text
          </label>
          <textarea
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            rows={2}
            placeholder="Describe the image for accessibility"
            className="w-full px-3 py-2 text-sm border border-[#E8E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5644E]/20 focus:border-[#E5644E] resize-none"
          />
          <p className="mt-1 text-xs text-[#9C9C91]">
            Describe for screen readers and SEO
          </p>
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A18] mb-2">
            Caption{" "}
            <span className="text-[#9C9C91] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption below the image"
            className="w-full px-3 py-2 text-sm border border-[#E8E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5644E]/20 focus:border-[#E5644E]"
          />
        </div>

        {/* Replace button */}
        <button
          type="button"
          onClick={() => setShowReplace(true)}
          className="w-full px-4 py-2 text-sm font-medium text-[#6B6B63] bg-[#F5F5F3] rounded-lg hover:bg-[#EEEEE9] transition-colors"
        >
          Replace Image
        </button>
      </ModalBody>

      <ModalFooter>
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
          className="px-4 py-2 text-sm font-medium text-white bg-[#E5644E] rounded-lg hover:bg-[#D45A45] transition-colors"
        >
          Save
        </button>
      </ModalFooter>
    </Modal>
  );
}

function ReplaceImageModal({
  onSelect,
  onBack,
  onClose,
}: {
  onSelect: (path: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"upload" | "library">("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api
      .getMedia()
      .then((res) => {
        const images = (res.data as MediaItem[]).filter((item) =>
          item.mimetype.startsWith("image/")
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
    <Modal title="Replace Image" onClose={onClose} onBack={onBack} maxWidth="2xl">
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
            <p className="text-xs text-[#9C9C91] mt-1">Upload an image first</p>
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
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-[#6B6B63] bg-white border border-[#E8E8E3] rounded-lg hover:bg-[#F5F5F3] transition-colors"
        >
          Back
        </button>
      </ModalFooter>
    </Modal>
  );
}
