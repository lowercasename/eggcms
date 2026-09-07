// src/admin/components/richtext/LinkModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LinkModal from "./LinkModal";
import { api } from "../../lib/api";
import { fakeLibrary } from "../../test/fakeLibrary";
import type { MediaItemResponse } from "../../../lib/media";

const mediaLibrary: MediaItemResponse[] = [
  {
    id: "1",
    filename: "2021_Govor_Belarus.pdf",
    path: "/uploads/belarus.pdf",
    mimetype: "application/pdf",
    kind: "document",
    size: 1024,
    created_at: "2026-01-03T00:00:00.000Z",
  },
  {
    id: "2",
    filename: "interview.mp3",
    path: "/uploads/interview.mp3",
    mimetype: "audio/mpeg",
    kind: "audio",
    size: 2048,
    created_at: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "3",
    filename: "cover.jpg",
    path: "/uploads/cover.jpg",
    mimetype: "image/jpeg",
    kind: "image",
    size: 512,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getSchemas).mockResolvedValue({ data: [] });
  vi.mocked(api.getMedia).mockImplementation(fakeLibrary(mediaLibrary));
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
    expect(await screen.findByText(/could not load the library/i)).toBeInTheDocument();
    expect(screen.queryByText(/no files/i)).not.toBeInTheDocument();
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

  it("saves the file path as the link href with one click, like every other picker", async () => {
    const onSaveExternal = vi.fn();
    open({ onSaveExternal });

    fireEvent.click(screen.getByRole("tab", { name: /^file$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /2021_Govor_Belarus\.pdf/ }));

    expect(onSaveExternal).toHaveBeenCalledWith("/uploads/belarus.pdf");
  });

  it("filters the list by filename", async () => {
    open();
    fireEvent.click(screen.getByRole("tab", { name: /^file$/i }));
    await screen.findByText("2021_Govor_Belarus.pdf");

    fireEvent.change(screen.getByRole("searchbox", { name: /search by file name/i }), {
      target: { value: "belarus" },
    });

    expect(await screen.findByText("2021_Govor_Belarus.pdf")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("interview.mp3")).not.toBeInTheDocument());
  });

  it("opens on the File tab, with the file marked, when editing a link that points at an upload", async () => {
    open({ currentHref: "/uploads/belarus.pdf" });

    const card = await screen.findByRole("button", { name: /2021_Govor_Belarus\.pdf/ });
    expect(card).toHaveAttribute("aria-pressed", "true");
  });
});
