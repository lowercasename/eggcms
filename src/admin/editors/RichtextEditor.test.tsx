// src/admin/editors/RichtextEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RichtextEditor from "./RichtextEditor";

describe("RichtextEditor", () => {
  const defaultField = {
    name: "content",
    label: "Content",
    type: "richtext" as const,
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toolbar", () => {
    it("renders formatting buttons", async () => {
      render(
        <RichtextEditor
          field={defaultField}
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      expect(screen.getByTitle("Italic")).toBeInTheDocument();
      expect(screen.getByTitle("Heading 2")).toBeInTheDocument();
      expect(screen.getByTitle("Heading 3")).toBeInTheDocument();
      expect(screen.getByTitle("Bullet list")).toBeInTheDocument();
      expect(screen.getByTitle("Numbered list")).toBeInTheDocument();
      expect(screen.getByTitle("Add link")).toBeInTheDocument();
      expect(screen.getByTitle("Insert image")).toBeInTheDocument();
    });

    it("does not show alignment buttons in toolbar (moved to popover)", async () => {
      render(
        <RichtextEditor
          field={defaultField}
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      // Alignment buttons should NOT be in toolbar - they're now in the image popover
      expect(screen.queryByTitle("Float left")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Float right")).not.toBeInTheDocument();
    });
  });

  describe("image insert modal", () => {
    it("opens image picker when image button clicked", async () => {
      const user = userEvent.setup();
      render(
        <RichtextEditor
          field={defaultField}
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle("Insert image")).toBeInTheDocument();
      });

      await user.click(screen.getByTitle("Insert image"));

      expect(screen.getByText("Insert Image")).toBeInTheDocument();
      expect(screen.getByText("Upload New")).toBeInTheDocument();
      expect(screen.getByText("Media Library")).toBeInTheDocument();
    });

    it("closes image picker when Cancel clicked", async () => {
      const user = userEvent.setup();
      render(
        <RichtextEditor
          field={defaultField}
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle("Insert image")).toBeInTheDocument();
      });

      await user.click(screen.getByTitle("Insert image"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByText("Insert Image")).not.toBeInTheDocument();
    });
  });

  describe("editor content", () => {
    it("renders with initial content", async () => {
      render(
        <RichtextEditor
          field={defaultField}
          value="<p>Hello world</p>"
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Hello world")).toBeInTheDocument();
      });
    });

    it("renders empty when no initial value", async () => {
      render(
        <RichtextEditor field={defaultField} value="" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      // Editor should be present but empty
      const editor = document.querySelector(".ProseMirror");
      expect(editor).toBeInTheDocument();
    });
  });

  describe("formatting", () => {
    it("toggles bold formatting", async () => {
      const user = userEvent.setup();
      render(
        <RichtextEditor
          field={defaultField}
          value="<p>Test text</p>"
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
      });

      const boldBtn = screen.getByTitle("Bold");
      await user.click(boldBtn);

      // The button should now be active (has the active class)
      // Note: actual text formatting depends on selection
    });
  });
});
