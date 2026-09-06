// src/admin/components/Dropzone.tsx
import { useRef, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";

interface Props {
  /** Called with the dropped files. Never called with an empty list. */
  onFiles: (files: File[]) => void;
  children: ReactNode;
  /** Ignore drags entirely (e.g. while an upload is already running). */
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Wraps an area so files can be dropped anywhere on it.
 *
 * Drag events fire for every child element the pointer crosses, so the overlay
 * is driven by a counter rather than a boolean: dragenter increments and
 * dragleave decrements, and the overlay shows while the count is above zero.
 * A boolean flickers as the pointer moves between children.
 */
export default function Dropzone({
  onFiles,
  children,
  disabled = false,
  label = "Drop files to upload",
  className = "",
}: Props) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const hasFiles = (e: React.DragEvent) => {
    const types = e.dataTransfer?.types;
    if (!types) return false;
    return Array.from(types).includes("Files");
  };

  const reset = () => {
    depth.current = 0;
    setDragging(false);
  };

  return (
    <div
      data-testid="dropzone"
      className={`relative ${className}`}
      onDragEnter={(e) => {
        if (disabled || !hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (disabled || !hasFiles(e)) return;
        // Without this the browser navigates to the file instead of dropping.
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (disabled) return;
        e.preventDefault();
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        reset();
        const files = Array.from(e.dataTransfer?.files ?? []);
        if (files.length > 0) onFiles(files);
      }}
    >
      {children}

      {dragging && (
        <div
          data-testid="dropzone-overlay"
          className="absolute inset-0 z-40 flex items-center justify-center rounded-panel border-[2.5px] border-dashed border-action bg-action-tint/90 pointer-events-none animate-fade-in"
        >
          <div className="flex flex-col items-center gap-2 text-action-text">
            <Upload className="w-8 h-8" aria-hidden />
            <p className="m-0 text-[16px] font-bold">{label}</p>
          </div>
        </div>
      )}
    </div>
  );
}
