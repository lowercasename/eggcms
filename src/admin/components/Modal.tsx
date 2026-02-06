// src/admin/components/Modal.tsx
import { createPortal } from "react-dom";
import { X, ArrowLeft } from "lucide-react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Show back button instead of just close */
  onBack?: () => void;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export default function Modal({
  children,
  onClose,
  title,
  maxWidth = "md",
  onBack,
}: ModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[80vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E3]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-md text-[#9C9C91] hover:bg-[#F5F5F3] hover:text-[#1A1A18] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-lg font-semibold text-[#1A1A18]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9C9C91] hover:bg-[#F5F5F3] hover:text-[#1A1A18] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>,
    document.body
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className = "" }: ModalBodyProps) {
  return (
    <div className={`flex-1 overflow-y-auto px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-[#E8E8E3] bg-[#FAFAF8] rounded-b-xl flex justify-end gap-3">
      {children}
    </div>
  );
}
