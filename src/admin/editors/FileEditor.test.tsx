import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileEditor from "./FileEditor";
import { api } from "../lib/api";
import { fakeLibrary } from "../test/fakeLibrary";
import type { MediaItemResponse } from "../../lib/media";

const field = { name: "pdf", type: "file" as const };

const library: MediaItemResponse[] = [
  {
    id: "1",
    filename: "essay.pdf",
    path: "/uploads/essay.pdf",
    mimetype: "application/pdf",
    kind: "document",
    size: 1024,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    filename: "cover.jpg",
    path: "/uploads/cover.jpg",
    mimetype: "image/jpeg",
    kind: "image",
    size: 2048,
    created_at: "2026-01-02T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getMedia).mockImplementation(fakeLibrary(library));
  vi.mocked(api.findMedia).mockImplementation(async (path: string) => library.find((m) => m.path === path) ?? null);
  vi.mocked(api.uploadMedia).mockResolvedValue({
    data: { id: "3", path: "/uploads/new.pdf", filename: "new.pdf" },
  } as never);
});

describe("FileEditor", () => {
  it("shows a prompt when no file is attached", () => {
    render(<FileEditor field={field} value={null} onChange={vi.fn()} />);
    expect(screen.getByText(/no file/i)).toBeInTheDocument();
  });

  it("shows the original filename for an attached file", async () => {
    render(<FileEditor field={field} value="/uploads/essay.pdf" onChange={vi.fn()} />);
    expect(await screen.findByTestId("file-filename")).toHaveTextContent("essay.pdf");
  });

  it("links to the attached file so it can be checked", async () => {
    render(<FileEditor field={field} value="/uploads/essay.pdf" onChange={vi.fn()} />);
    const link = await screen.findByRole("link", { name: /essay\.pdf/i });
    expect(link).toHaveAttribute("href", "/uploads/essay.pdf");
  });

  it("falls back to the path when the file is not in the library", async () => {
    render(<FileEditor field={field} value="/uploads/orphan.pdf" onChange={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByTestId("file-filename")).toHaveTextContent("orphan.pdf")
    );
  });

  it("uploads a dropped file and stores its path", async () => {
    const onChange = vi.fn();
    render(<FileEditor field={field} value={null} onChange={onChange} />);

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: {
        files: [new File(["x"], "new.pdf", { type: "application/pdf" })],
        items: [],
        types: ["Files"],
      },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("/uploads/new.pdf"));
  });

  it("reports an upload that was refused", async () => {
    vi.mocked(api.uploadMedia).mockRejectedValue(
      new Error("Files of type application/x-msdownload can't be uploaded")
    );
    render(<FileEditor field={field} value={null} onChange={vi.fn()} />);

    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: {
        files: [new File(["x"], "installer.exe", { type: "application/x-msdownload" })],
        items: [],
        types: ["Files"],
      },
    });

    expect(await screen.findByText(/can't be uploaded/i)).toBeInTheDocument();
  });

  it("refuses a dropped image, since this field takes documents", async () => {
    const onChange = vi.fn();
    render(<FileEditor field={field} value={null} onChange={onChange} />);
    fireEvent.drop(screen.getByTestId("dropzone"), {
      dataTransfer: {
        files: [new File(["x"], "photo.jpg", { type: "image/jpeg" })],
        items: [],
        types: ["Files"],
      },
    });
    expect(await screen.findByText(/only documents/i)).toBeInTheDocument();
    expect(api.uploadMedia).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the field", async () => {
    const onChange = vi.fn();
    render(<FileEditor field={field} value="/uploads/essay.pdf" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("offers documents, not images, when choosing from the library", async () => {
    render(<FileEditor field={field} value={null} onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /choose from library/i }));

    expect(await screen.findByText("essay.pdf")).toBeInTheDocument();
    expect(screen.queryByText("cover.jpg")).not.toBeInTheDocument();
  });

  it("stores the path of a file chosen from the library", async () => {
    const onChange = vi.fn();
    render(<FileEditor field={field} value={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /choose from library/i }));
    await userEvent.click(await screen.findByText("essay.pdf"));

    expect(onChange).toHaveBeenCalledWith("/uploads/essay.pdf");
  });
});
