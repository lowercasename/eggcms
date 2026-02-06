// src/admin/components/richtext/ImageNodeView.tsx
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Settings,
  Trash2,
} from "lucide-react";
import ImageSettingsModal from "./ImageSettingsModal";

type Size = "small" | "medium" | "large" | "full";
type Alignment = "left" | "center" | "right";

const SIZE_WIDTHS: Record<Size, string> = {
  small: "25%",
  medium: "50%",
  large: "75%",
  full: "100%",
};

export default function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { src, size, width, alt, caption, alignment } = node.attrs;
  const currentSize = (size || "medium") as Size;
  const currentAlignment = (alignment || "center") as Alignment;

  // Compute displayed width: custom width overrides size preset
  const computedWidth = width || SIZE_WIDTHS[currentSize];

  // Update popover position when selected
  useEffect(() => {
    if (selected && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.top - 8, // 8px gap above image
        left: rect.left + rect.width / 2,
      });
    }
  }, [selected, currentSize, width, currentAlignment]);

  const setSize = (newSize: Size) => {
    updateAttributes({ size: newSize, width: null });
  };

  const setAlignment = (newAlignment: Alignment) => {
    updateAttributes({ alignment: newAlignment });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSettings(true);
  };

  return (
    <NodeViewWrapper
      as="figure"
      className="image-figure"
      data-alignment={currentAlignment}
      style={{ width: computedWidth }}
    >
      <div className="image-container" onDoubleClick={handleDoubleClick} ref={containerRef}>
        <img
          src={src}
          alt={alt || ""}
          className={selected ? "selected" : ""}
          draggable={false}
        />
      </div>

      {/* Floating popover when selected - rendered via portal */}
      {selected && createPortal(
        <div
          className="image-popover"
          style={{
            position: 'fixed',
            top: popoverPosition.top,
            left: popoverPosition.left,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Size presets */}
          <div className="popover-group">
            {(["small", "medium", "large", "full"] as Size[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`popover-btn ${currentSize === s && !width ? "active" : ""}`}
                title={`${s.charAt(0).toUpperCase() + s.slice(1)} size`}
              >
                {s === "small" && "S"}
                {s === "medium" && "M"}
                {s === "large" && "L"}
                {s === "full" && "Full"}
              </button>
            ))}
          </div>

          <div className="popover-divider" />

          {/* Alignment */}
          <div className="popover-group">
            <button
              type="button"
              onClick={() => setAlignment("left")}
              className={`popover-btn ${currentAlignment === "left" ? "active" : ""}`}
              title="Align left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAlignment("center")}
              className={`popover-btn ${currentAlignment === "center" ? "active" : ""}`}
              title="Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAlignment("right")}
              className={`popover-btn ${currentAlignment === "right" ? "active" : ""}`}
              title="Align right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="popover-divider" />

          {/* Actions */}
          <div className="popover-group">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="popover-btn"
              title="Image settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              className="popover-btn popover-btn-danger"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Caption */}
      {caption && <figcaption>{caption}</figcaption>}

      {/* Settings modal */}
      {showSettings && (
        <ImageSettingsModal
          src={src}
          size={currentSize}
          width={width}
          alt={alt || ""}
          caption={caption || ""}
          onSave={(attrs) => {
            updateAttributes(attrs);
            setShowSettings(false);
          }}
          onReplace={(newSrc) => {
            updateAttributes({ src: newSrc });
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </NodeViewWrapper>
  );
}
