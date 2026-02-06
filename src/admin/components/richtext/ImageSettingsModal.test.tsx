// src/admin/components/richtext/ImageSettingsModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageSettingsModal from "./ImageSettingsModal";

describe("ImageSettingsModal", () => {
  const defaultProps = {
    src: "/uploads/test-image.jpg",
    size: "medium" as const,
    width: null as string | null,
    alt: "Test image",
    caption: "Test caption",
    onSave: vi.fn(),
    onReplace: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the modal with title", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      expect(screen.getByText("Image Settings")).toBeInTheDocument();
    });

    it("displays image preview", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      const preview = screen.getByRole("img");
      expect(preview).toHaveAttribute("src", "/uploads/test-image.jpg");
    });

    it("shows all size preset buttons", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Small" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Medium" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Large" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Full" })).toBeInTheDocument();
    });

    it("shows custom width input", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      expect(screen.getByPlaceholderText("e.g., 300px")).toBeInTheDocument();
    });

    it("shows alt text textarea with initial value", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      const altInput = screen.getByPlaceholderText(
        "Describe the image for accessibility"
      );
      expect(altInput).toHaveValue("Test image");
    });

    it("shows caption input with initial value", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      const captionInput = screen.getByPlaceholderText(
        "Add a caption below the image"
      );
      expect(captionInput).toHaveValue("Test caption");
    });

    it("shows Replace Image button", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: "Replace Image" })
      ).toBeInTheDocument();
    });

    it("shows Save and Cancel buttons", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });
  });

  describe("size selection", () => {
    it("highlights the current size", () => {
      render(<ImageSettingsModal {...defaultProps} />);

      const mediumBtn = screen.getByRole("button", { name: "Medium" });
      expect(mediumBtn).toHaveClass("border-[#E5644E]");
    });

    it("changes size when clicking a preset", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Large" }));

      const largeBtn = screen.getByRole("button", { name: "Large" });
      expect(largeBtn).toHaveClass("border-[#E5644E]");
    });

    it("clears custom width when selecting a size preset", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, width: "300px" };
      render(<ImageSettingsModal {...props} />);

      const widthInput = screen.getByPlaceholderText("e.g., 300px");
      expect(widthInput).toHaveValue("300px");

      await user.click(screen.getByRole("button", { name: "Large" }));

      expect(widthInput).toHaveValue("");
    });
  });

  describe("custom width input", () => {
    it("accepts numeric input", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      const widthInput = screen.getByPlaceholderText("e.g., 300px");
      await user.clear(widthInput);
      await user.type(widthInput, "400");

      expect(widthInput).toHaveValue("400");
    });

    it("adds px suffix on blur when only numbers entered", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      const widthInput = screen.getByPlaceholderText("e.g., 300px");
      await user.clear(widthInput);
      await user.type(widthInput, "400");
      await user.tab(); // blur

      expect(widthInput).toHaveValue("400px");
    });

    it("does not double-add px suffix", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      const widthInput = screen.getByPlaceholderText("e.g., 300px");
      await user.clear(widthInput);
      await user.type(widthInput, "400px");
      await user.tab(); // blur

      expect(widthInput).toHaveValue("400px");
    });

    it("strips invalid characters", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      const widthInput = screen.getByPlaceholderText("e.g., 300px");
      await user.clear(widthInput);
      await user.type(widthInput, "abc123def");

      expect(widthInput).toHaveValue("123");
    });
  });

  describe("alt text", () => {
    it("updates alt text on input", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      const altInput = screen.getByPlaceholderText(
        "Describe the image for accessibility"
      );
      await user.clear(altInput);
      await user.type(altInput, "New alt text");

      expect(altInput).toHaveValue("New alt text");
    });
  });

  describe("caption", () => {
    it("updates caption on input", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      const captionInput = screen.getByPlaceholderText(
        "Add a caption below the image"
      );
      await user.clear(captionInput);
      await user.type(captionInput, "New caption");

      expect(captionInput).toHaveValue("New caption");
    });
  });

  describe("save functionality", () => {
    it("calls onSave with updated values when Save clicked", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<ImageSettingsModal {...defaultProps} onSave={onSave} />);

      // Change size
      await user.click(screen.getByRole("button", { name: "Large" }));

      // Change alt
      const altInput = screen.getByPlaceholderText(
        "Describe the image for accessibility"
      );
      await user.clear(altInput);
      await user.type(altInput, "Updated alt");

      // Change caption
      const captionInput = screen.getByPlaceholderText(
        "Add a caption below the image"
      );
      await user.clear(captionInput);
      await user.type(captionInput, "Updated caption");

      // Save
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onSave).toHaveBeenCalledWith({
        size: "large",
        width: null,
        alt: "Updated alt",
        caption: "Updated caption",
      });
    });

    it("includes custom width in save when set", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<ImageSettingsModal {...defaultProps} onSave={onSave} />);

      const widthInput = screen.getByPlaceholderText("e.g., 300px");
      await user.type(widthInput, "350px");

      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          width: "350px",
        })
      );
    });
  });

  describe("cancel functionality", () => {
    it("calls onClose when Cancel clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ImageSettingsModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when X button clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ImageSettingsModal {...defaultProps} onClose={onClose} />);

      // Find the X button in header (there's an X icon)
      const closeButtons = screen.getAllByRole("button");
      const xButton = closeButtons.find((btn) =>
        btn.querySelector("svg.lucide-x")
      );
      await user.click(xButton!);

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when backdrop clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ImageSettingsModal {...defaultProps} onClose={onClose} />);

      // Click the backdrop (the semi-transparent overlay)
      const backdrop = document.querySelector(".bg-black\\/50");
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("replace image flow", () => {
    it("shows replace modal when Replace Image clicked", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Replace Image" }));

      expect(screen.getByText("Replace Image")).toBeInTheDocument();
      expect(screen.getByText("Upload New")).toBeInTheDocument();
      expect(screen.getByText("Media Library")).toBeInTheDocument();
    });

    it("can go back from replace modal", async () => {
      const user = userEvent.setup();
      render(<ImageSettingsModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Replace Image" }));
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(screen.getByText("Image Settings")).toBeInTheDocument();
    });
  });

  describe("initial state with custom width", () => {
    it("shows custom width when provided", () => {
      const props = { ...defaultProps, width: "350px" };
      render(<ImageSettingsModal {...props} />);

      const widthInput = screen.getByPlaceholderText("e.g., 300px");
      expect(widthInput).toHaveValue("350px");
    });

    it("does not highlight size preset when custom width is set", () => {
      const props = { ...defaultProps, width: "350px" };
      render(<ImageSettingsModal {...props} />);

      const mediumBtn = screen.getByRole("button", { name: "Medium" });
      // Should not have the active border color when custom width is set
      expect(mediumBtn).not.toHaveClass("border-[#E5644E]");
    });
  });
});
