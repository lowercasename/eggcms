// src/admin/components/richtext/LinkModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LinkModal from "./LinkModal";
import { api } from "../../lib/api";

const mediaLibrary = [
  {
    id: "1",
    filename: "2021_Govor_Belarus.pdf",
    path: "/uploads/belarus.pdf",
    mimetype: "application/pdf",
    kind: "document",
    size: 1024,
  },
  {
    id: "2",
    filename: "interview.mp3",
    path: "/uploads/interview.mp3",
    mimetype: "audio/mpeg",
    kind: "audio",
    size: 2048,
  },
  {
    id: "3",
    filename: "cover.jpg",
    path: "/uploads/cover.jpg",
    mimetype: "image/jpeg",
    kind: "image",
    size: 512,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getSchemas).mockResolvedValue({ data: [] });
  vi.mocked(api.getMedia).mockResolvedValue({ data: mediaLibrary } as never);
});

describe("LinkModal external URL normalization", () => {
  it("prepends https:// to bare hostnames", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="example.com"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("https://example.com");
  });

  it("leaves https:// URLs unchanged", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="https://example.com"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("https://example.com");
  });

  it("leaves relative paths unchanged", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="/about"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("/about");
  });

  it("leaves anchor links unchanged", () => {
    const onSaveExternal = vi.fn();
    render(
      <LinkModal
        currentHref="#section-2"
        onSaveExternal={onSaveExternal}
        onSaveInternal={() => {}}
        onRemove={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Update"));
    expect(onSaveExternal).toHaveBeenCalledWith("#section-2");
  });
});

describe("LinkModal when the library cannot be read", () => {
  it("says so rather than claiming the library is empty", async () => {
    vi.mocked(api.getMedia).mockRejectedValue(new Error("Request failed"));
    render(
      <LinkModal onSaveExternal={vi.fn()} onSaveInternal={vi.fn()} onRemove={vi.fn()} onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("tab", { name: /^file$/i }));
    expect(await screen.findByText(/could not load the files/i)).toBeInTheDocument();
    expect(screen.queryByText(/no files in the library/i)).not.toBeInTheDocument();
  });
});

describe("LinkModal file links", () => {
  const open = (props: Partial<React.ComponentProps<typeof LinkModal>> = {}) =>
    render(
      <LinkModal
        onSaveExternal={vi.fn()}
        onSaveInternal={vi.fn()}
        onRemove={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />
    );

  it("offers a File tab", () => {
    open();
    expect(screen.getByRole("tab", { name: /file/i })).toBeInTheDocument();
  });

  it("lists documents and audio, but not images", async () => {
    open();
    fireEvent.click(screen.getByRole("tab", { name: /^file$/i }));

    expect(await screen.findByText("2021_Govor_Belarus.pdf")).toBeInTheDocument();
    expect(screen.getByText("interview.mp3")).toBeInTheDocument();
    // Images belong in the editor's image button, not in a text link.
    expect(screen.queryByText("cover.jpg")).not.toBeInTheDocument();
  });

  it("saves the file path as the link href", async () => {
    const onSaveExternal = vi.fn();
    open({ onSaveExternal });

    fireEvent.click(screen.getByRole("tab", { name: /^file$/i }));
    fireEvent.click(await screen.findByText("2021_Govor_Belarus.pdf"));
    fireEvent.click(screen.getByText("Insert"));

    expect(onSaveExternal).toHaveBeenCalledWith("/uploads/belarus.pdf");
  });

  it("filters the list by filename", async () => {
    open();
    fireEvent.click(screen.getByRole("tab", { name: /^file$/i }));
    await screen.findByText("2021_Govor_Belarus.pdf");

    fireEvent.change(screen.getByPlaceholderText(/search files/i), {
      target: { value: "belarus" },
    });

    expect(screen.getByText("2021_Govor_Belarus.pdf")).toBeInTheDocument();
    expect(screen.queryByText("interview.mp3")).not.toBeInTheDocument();
  });

  it("opens on the File tab when editing a link that points at an upload", async () => {
    open({ currentHref: "/uploads/belarus.pdf" });

    expect(await screen.findByText("2021_Govor_Belarus.pdf")).toBeInTheDocument();
  });
});
