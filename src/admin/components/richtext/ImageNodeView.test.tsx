// src/admin/components/richtext/ImageNodeView.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageNodeView from "./ImageNodeView";

// Mock Tiptap's NodeViewWrapper
vi.mock("@tiptap/react", () => ({
  NodeViewWrapper: ({
    children,
    as,
    className,
    style,
    ...props
  }: {
    children: React.ReactNode;
    as?: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }) => {
    const Component = as || "div";
    return (
      <Component className={className} style={style} data-testid="figure" {...props}>
        {children}
      </Component>
    );
  },
}));

describe("ImageNodeView", () => {
  const defaultNode = {
    attrs: {
      src: "/uploads/test-image.jpg",
      size: "medium",
      width: null,
      alt: "Test image",
      caption: "",
      alignment: "center",
    },
  };

  const mockUpdateAttributes = vi.fn();
  const mockDeleteNode = vi.fn();

  const defaultProps = {
    node: defaultNode,
    updateAttributes: mockUpdateAttributes,
    deleteNode: mockDeleteNode,
    selected: false,
    editor: {} as any,
    getPos: () => 0,
    decorations: [] as any,
    extension: {} as any,
    HTMLAttributes: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the image with correct src and alt", () => {
      render(<ImageNodeView {...defaultProps} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "/uploads/test-image.jpg");
      expect(img).toHaveAttribute("alt", "Test image");
    });

    it("applies correct width based on size preset", () => {
      render(<ImageNodeView {...defaultProps} />);

      const figure = screen.getByTestId("figure");
      expect(figure).toHaveStyle({ width: "50%" }); // medium = 50%
    });

    it("uses custom width when provided", () => {
      const props = {
        ...defaultProps,
        node: {
          attrs: {
            ...defaultNode.attrs,
            width: "300px",
          },
        },
      };
      render(<ImageNodeView {...props} />);

      const figure = screen.getByTestId("figure");
      expect(figure).toHaveStyle({ width: "300px" });
    });

    it("renders caption when provided", () => {
      const props = {
        ...defaultProps,
        node: {
          attrs: {
            ...defaultNode.attrs,
            caption: "A beautiful sunset",
          },
        },
      };
      render(<ImageNodeView {...props} />);

      expect(screen.getByText("A beautiful sunset")).toBeInTheDocument();
    });

    it("does not render caption when empty", () => {
      render(<ImageNodeView {...defaultProps} />);

      const figcaption = document.querySelector("figcaption");
      expect(figcaption).not.toBeInTheDocument();
    });

    it("applies selected class when selected", () => {
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      const img = screen.getByRole("img");
      expect(img).toHaveClass("selected");
    });
  });

  describe("popover controls", () => {
    it("does not show popover when not selected", () => {
      render(<ImageNodeView {...defaultProps} />);

      expect(screen.queryByTitle("Small size")).not.toBeInTheDocument();
    });

    it("shows popover when selected", () => {
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      expect(screen.getByTitle("Small size")).toBeInTheDocument();
      expect(screen.getByTitle("Medium size")).toBeInTheDocument();
      expect(screen.getByTitle("Large size")).toBeInTheDocument();
      expect(screen.getByTitle("Full size")).toBeInTheDocument();
    });

    it("shows alignment buttons when selected", () => {
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      expect(screen.getByTitle("Align left")).toBeInTheDocument();
      expect(screen.getByTitle("Center")).toBeInTheDocument();
      expect(screen.getByTitle("Align right")).toBeInTheDocument();
    });

    it("shows settings and delete buttons when selected", () => {
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      expect(screen.getByTitle("Image settings")).toBeInTheDocument();
      expect(screen.getByTitle("Delete image")).toBeInTheDocument();
    });
  });

  describe("size controls", () => {
    it("updates size to small when S button clicked", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      await user.click(screen.getByTitle("Small size"));

      expect(mockUpdateAttributes).toHaveBeenCalledWith({
        size: "small",
        width: null,
      });
    });

    it("updates size to large when L button clicked", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      await user.click(screen.getByTitle("Large size"));

      expect(mockUpdateAttributes).toHaveBeenCalledWith({
        size: "large",
        width: null,
      });
    });

    it("updates size to full when Full button clicked", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      await user.click(screen.getByTitle("Full size"));

      expect(mockUpdateAttributes).toHaveBeenCalledWith({
        size: "full",
        width: null,
      });
    });

    it("highlights the current size button", () => {
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      const mediumBtn = screen.getByTitle("Medium size");
      expect(mediumBtn).toHaveClass("active");
    });
  });

  describe("alignment controls", () => {
    it("updates alignment to left", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      await user.click(screen.getByTitle("Align left"));

      expect(mockUpdateAttributes).toHaveBeenCalledWith({ alignment: "left" });
    });

    it("updates alignment to right", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      await user.click(screen.getByTitle("Align right"));

      expect(mockUpdateAttributes).toHaveBeenCalledWith({ alignment: "right" });
    });

    it("highlights the current alignment button", () => {
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      const centerBtn = screen.getByTitle("Center");
      expect(centerBtn).toHaveClass("active");
    });
  });

  describe("delete functionality", () => {
    it("calls deleteNode when delete button clicked", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      await user.click(screen.getByTitle("Delete image"));

      expect(mockDeleteNode).toHaveBeenCalled();
    });
  });

  describe("settings modal", () => {
    it("opens settings modal when gear button clicked", async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, selected: true };
      render(<ImageNodeView {...props} />);

      await user.click(screen.getByTitle("Image settings"));

      expect(screen.getByText("Image Settings")).toBeInTheDocument();
    });

    it("opens settings modal on double-click", async () => {
      render(<ImageNodeView {...defaultProps} />);

      const container = document.querySelector(".image-container");
      fireEvent.doubleClick(container!);

      expect(screen.getByText("Image Settings")).toBeInTheDocument();
    });
  });

  describe("size presets width mapping", () => {
    it.each([
      ["small", "25%"],
      ["medium", "50%"],
      ["large", "75%"],
      ["full", "100%"],
    ])("renders %s size as %s width", (size, expectedWidth) => {
      const props = {
        ...defaultProps,
        node: {
          attrs: {
            ...defaultNode.attrs,
            size,
          },
        },
      };
      render(<ImageNodeView {...props} />);

      const figure = screen.getByTestId("figure");
      expect(figure).toHaveStyle({ width: expectedWidth });
    });
  });
});
