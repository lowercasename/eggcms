// src/admin/pages/ItemEdit.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ItemEdit from "./ItemEdit";
import type { Schema } from "../types";

// Hoist mocks to avoid initialization order issues
const { mockNavigate, mockApi } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockApi: {
    getItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: () => ["/", mockNavigate],
}));

// Mock api
vi.mock("../lib/api", () => ({
  api: mockApi,
}));

// Mock editors using actual component files
vi.mock("../editors/StringEditor", async () => {
  const React = await import("react");
  return {
    default: ({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) =>
      React.createElement("input", {
        "data-testid": "string-editor",
        value: (value as string) || "",
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      }),
  };
});

vi.mock("../editors/ImageEditor", async () => {
  const React = await import("react");
  return {
    default: ({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) =>
      React.createElement("div", { "data-testid": "image-editor" }, [
        React.createElement("span", { key: "val", "data-testid": "image-value" }, String(value || "none")),
        React.createElement(
          "button",
          {
            key: "btn",
            type: "button",
            "data-testid": "select-image-btn",
            onClick: () => onChange("/uploads/new-image.jpg"),
          },
          "Select Image"
        ),
      ]),
  };
});

vi.mock("../editors/TextEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "text-editor" }) };
});

vi.mock("../editors/RichtextEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "richtext-editor" }) };
});

vi.mock("../editors/NumberEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "number-editor" }) };
});

vi.mock("../editors/BooleanEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "boolean-editor" }) };
});

vi.mock("../editors/DatetimeEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "datetime-editor" }) };
});

vi.mock("../editors/SelectEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "select-editor" }) };
});

vi.mock("../editors/SlugEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "slug-editor" }) };
});

vi.mock("../editors/BlocksEditor", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", { "data-testid": "blocks-editor" }) };
});

// Import the provider for wrapping tests
import { DirtyStateProvider } from "../contexts/DirtyStateContext";

// Helper to render with provider
function renderWithProvider(ui: React.ReactElement) {
  return render(<DirtyStateProvider>{ui}</DirtyStateProvider>);
}

describe("ItemEdit", () => {
  const mockSchema: Schema = {
    name: "posts",
    label: "Posts",
    type: "collection",
    fields: [
      { name: "title", type: "string", required: true },
    ],
  };

  const mockRefreshList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("button labels", () => {
    describe("new item", () => {
      it("shows 'Publish' and 'Save as Draft' buttons", async () => {
        renderWithProvider(
          <ItemEdit schema={mockSchema} itemId="new" refreshList={mockRefreshList} />
        );

        await waitFor(() => {
          expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        });

        expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save as Draft" })).toBeInTheDocument();
      });
    });

    describe("existing draft item", () => {
      beforeEach(() => {
        mockApi.getItem.mockResolvedValue({
          data: { id: "123", title: "Test Post", _meta: { draft: true } },
        });
      });

      it("shows 'Save & Publish' and 'Save Draft' buttons", async () => {
        renderWithProvider(
          <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
        );

        await waitFor(() => {
          expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        });

        expect(screen.getByRole("button", { name: "Save & Publish" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
      });
    });

    describe("existing published item", () => {
      beforeEach(() => {
        mockApi.getItem.mockResolvedValue({
          data: { id: "123", title: "Test Post", _meta: { draft: false } },
        });
      });

      it("shows 'Save' and 'Revert to Draft' buttons", async () => {
        renderWithProvider(
          <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
        );

        await waitFor(() => {
          expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        });

        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Revert to Draft" })).toBeInTheDocument();
      });
    });
  });

  describe("save actions", () => {
    beforeEach(() => {
      mockApi.getItem.mockResolvedValue({
        data: { id: "123", title: "Test Post", _meta: { draft: true } },
      });
      // Mock updateItem to return the correct _meta based on what was saved
      mockApi.updateItem.mockImplementation((_schema, _id, data) =>
        Promise.resolve({
          data: { id: "123", title: "Test Post", _meta: { draft: Boolean(data.draft) } }
        })
      );
    });

    it("saves as published when clicking primary button", async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save & Publish" }));

      await waitFor(() => {
        expect(mockApi.updateItem).toHaveBeenCalledWith(
          "posts",
          "123",
          expect.objectContaining({ draft: 0 })
        );
      });
    });

    it("saves as draft when clicking secondary button", async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save Draft" }));

      await waitFor(() => {
        expect(mockApi.updateItem).toHaveBeenCalledWith(
          "posts",
          "123",
          expect.objectContaining({ draft: 1 })
        );
      });
    });

    it("updates button labels after publishing a draft", async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Initially shows draft buttons
      expect(screen.getByRole("button", { name: "Save & Publish" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();

      // Click publish
      await user.click(screen.getByRole("button", { name: "Save & Publish" }));

      // After save, buttons should update to published state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Revert to Draft" })).toBeInTheDocument();
      });
    });

    it("updates button labels after reverting to draft", async () => {
      mockApi.getItem.mockResolvedValue({
        data: { id: "123", title: "Test Post", _meta: { draft: false } },
      });

      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Initially shows published buttons
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Revert to Draft" })).toBeInTheDocument();

      // Click revert to draft
      await user.click(screen.getByRole("button", { name: "Revert to Draft" }));

      // After save, buttons should update to draft state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save & Publish" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
      });
    });
  });

  describe("dirty state indicator", () => {
    beforeEach(() => {
      mockApi.getItem.mockResolvedValue({
        data: { id: "123", title: "Test Post", _meta: { draft: true } },
      });
    });

    it("shows Draft badge when not dirty", async () => {
      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.queryByText("Unsaved")).not.toBeInTheDocument();
    });

    it("shows Unsaved badge when dirty", async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Make a change to trigger dirty state
      const input = screen.getByTestId("string-editor");
      await user.clear(input);
      await user.type(input, "Modified Title");

      expect(screen.getByText("Unsaved")).toBeInTheDocument();
      expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    });

    it("shows Published badge for published items when not dirty", async () => {
      mockApi.getItem.mockResolvedValue({
        data: { id: "123", title: "Test Post", _meta: { draft: false } },
      });

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it("shows Unsaved badge when image field changes", async () => {
      const schemaWithImage: Schema = {
        name: "posts",
        label: "Posts",
        type: "collection",
        fields: [
          { name: "title", type: "string", required: true },
          { name: "image", type: "image", required: false },
        ],
      };

      mockApi.getItem.mockResolvedValue({
        data: { id: "123", title: "Test Post", image: null, _meta: { draft: true } },
      });

      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={schemaWithImage} itemId="123" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Initially shows Draft badge
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.queryByText("Unsaved")).not.toBeInTheDocument();

      // Select an image
      await user.click(screen.getByTestId("select-image-btn"));

      // Should now show Unsaved badge
      expect(screen.getByText("Unsaved")).toBeInTheDocument();
      expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    });
  });

  describe("create new item", () => {
    beforeEach(() => {
      mockApi.createItem.mockResolvedValue({
        data: { id: "new-123" },
      });
    });

    it("creates item as published when clicking Publish", async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="new" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => {
        expect(mockApi.createItem).toHaveBeenCalledWith(
          "posts",
          expect.objectContaining({ draft: 0 })
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith("/collections/posts/new-123", { replace: true });
    });

    it("creates item as draft when clicking Save as Draft", async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <ItemEdit schema={mockSchema} itemId="new" refreshList={mockRefreshList} />
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save as Draft" }));

      await waitFor(() => {
        expect(mockApi.createItem).toHaveBeenCalledWith(
          "posts",
          expect.objectContaining({ draft: 1 })
        );
      });
    });
  });
});
